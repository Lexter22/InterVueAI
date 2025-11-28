AgoraRTC.enableLogUpload();

class InterviewEngine {
  constructor() {
    this.client = null;
    this.localTracks = { videoTrack: null, audioTrack: null };
    this.remoteUsers = {};
    this.agoraConvoTaskID = "";
    this.config = {};
    this.jobRequirements = null;
    this.applicantName = "";
    this.applicantEmail = "";
    this.channelName = "10000";
  }

  async initialize() {
    await this.loadConfig();
    await this.loadJobRequirements();
    
    this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    
    this.client.on("user-published", async (user, mediaType) => {
      this.remoteUsers[user.uid] = user;
      console.log(`User ${user.uid} published ${mediaType}`);
      
      if (user.uid === 10002 && mediaType === "video") {
        await this.client.subscribe(user, "video");
        const container = document.getElementById("aiAvatar");
        if (container) {
          container.innerHTML = '';
          user.videoTrack.play(container);
          console.log("✓ Avatar video playing (late publish)");
        }
      }
    });
    
    this.client.on("user-unpublished", (user, mediaType) => {
      console.log(`User ${user.uid} unpublished ${mediaType}`);
    });
    
    this.client.on("user-left", (user) => {
      console.log(`User ${user.uid} left`);
      delete this.remoteUsers[user.uid];
    });
    
    await this.client.join(this.config.AGORA_APPID, this.channelName, this.config.AGORA_TOKEN, 10000);
    console.log("✓ Joined channel");
  }

  async loadConfig() {
    const res = await fetch("/config");
    if (!res.ok) throw new Error("Failed to load config from server");
    this.config = await res.json();
  }

  async loadJobRequirements() {
    const data = JSON.parse(localStorage.getItem('interviewData') || '{}');
    console.log('📦 Retrieved from localStorage:', data);
    
    if (data.job_requirements) {
      const requirements = data.job_requirements.split('\n').filter(r => r.trim());
      this.jobRequirements = {
        role: data.job_title,
        requirements: requirements
      };
      this.applicantName = data.full_name;
      this.applicantEmail = data.email;
      
      console.log('✓ Job Requirements loaded:', this.jobRequirements);
      console.log('✓ Applicant Name:', this.applicantName);
      console.log('✓ Applicant Email:', this.applicantEmail);
    } else {
      console.warn('⚠️ No interview data found in localStorage');
    }
  }

  async startLocalVideo(videoElement) {
    const tracks = await Promise.all([
      AgoraRTC.createMicrophoneAudioTrack({ encoderConfig: "music_standard" }),
      AgoraRTC.createCameraVideoTrack()
    ]);
    
    this.localTracks.audioTrack = tracks[0];
    this.localTracks.videoTrack = tracks[1];
    
    this.localTracks.videoTrack.play(videoElement, { mirror: true });
    await this.client.publish(Object.values(this.localTracks));
    console.log("✓ Published local tracks");
  }

  async startAIInterview() {
    const requestData = {
      name: this.channelName,
      properties: {
        channel: this.channelName,
        agent_rtc_uid: "10001",
        remote_rtc_uids: ["10000"],
        idle_timeout: 30,
        advanced_features: {
          enable_aivad: true,
          enable_mllm: false,
          enable_rtm: false
        },
        asr: { language: "en-US" },
        llm: {
          url: "https://api.groq.com/openai/v1/chat/completions",
          api_key: this.config.GROQ_KEY,
          system_messages: [{
            role: "system",
            content: this.generateInterviewPrompt()
          }],
          greeting_message: `Hello ${this.applicantName}! Thank you for applying for the ${this.jobRequirements?.role || 'position'}. Let's begin the interview.`,
          failure_message: "Sorry, I'm experiencing technical difficulties.",
          params: { model: "llama-3.3-70b-versatile" }
        },
        tts: {
          vendor: "minimax",
          params: {
            url: "wss://api.minimax.io/ws/v1/t2a_v2",
            group_id: this.config.TTS_MINIMAX_GROUPID,
            key: this.config.TTS_MINIMAX_KEY,
            model: "speech-2.6-turbo",
            voice_setting: {
              voice_id: "English_Lively_Male_11",
              speed: 1,
              vol: 1,
              pitch: 0,
              emotion: "happy"
            },
            audio_setting: { sample_rate: 16000 }
          },
          skip_patterns: [3, 4]
        },
        avatar: {
          vendor: "akool",
          enable: true,
          params: {
            api_key: this.config.AVATAR_AKOOL_KEY,
            agora_uid: "10002",
            avatar_id: "dvp_Sean_agora"
          }
        },
        parameters: {
          silence_config: {
            timeout_ms: 10000,
            action: "think",
            content: "continue conversation"
          }
        }
      }
    };

    const response = await fetch("/api/convo-ai/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData)
    });

    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    
    this.agoraConvoTaskID = result.agent_id;
    console.log("✓ AI agent started:", result.agent_id);
    
    await this.waitAndSubscribeToAvatar();
  }

  async waitAndSubscribeToAvatar() {
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const avatarUser = this.remoteUsers[10002];
      if (avatarUser) {
        console.log("✓ Avatar detected");
        await this.subscribeToAvatar(avatarUser);
        return;
      }
    }
    console.error("Avatar did not join");
  }

  async subscribeToAvatar(user) {
    if (user.hasAudio) {
      await this.client.subscribe(user, "audio");
      await user.audioTrack.play();
      console.log("✓ Avatar audio playing");
    }
    
    if (user.hasVideo) {
      await this.client.subscribe(user, "video");
      const container = document.getElementById("aiAvatar");
      if (container) {
        container.innerHTML = '';
        user.videoTrack.play(container);
        console.log("✓ Avatar video playing");
      }
    }
  }

  generateInterviewPrompt() {
    if (!this.jobRequirements) {
      return "You are a professional AI interviewer. Ask relevant questions about the candidate's experience and skills. Keep responses concise and professional.";
    }

    const requirementsList = this.jobRequirements.requirements
      .map((req, index) => `${index + 1}. ${req}`)
      .join('\n');
    
    const totalRequirements = this.jobRequirements.requirements.length;

    console.log('🤖 Generated Interview Prompt for:', this.jobRequirements.role);

    return `You are an AI interviewer for the ${this.jobRequirements.role} position. The candidate's name is ${this.applicantName}.

REQUIREMENTS TO ASSESS (${totalRequirements} total):
${requirementsList}

STRICT INTERVIEW RULES:
1. Ask EXACTLY ONE question per requirement - no more, no less
2. Total questions = ${totalRequirements} questions
3. Do NOT repeat questions
4. Do NOT ask follow-up questions beyond the requirement
5. After candidate answers, acknowledge briefly and move to the NEXT requirement
6. Keep track: After ${totalRequirements} questions, you MUST end the interview

INTERVIEW FLOW:
- Question 1: Ask about requirement #1
- Listen to answer → Brief acknowledgment → Move to requirement #2
- Question 2: Ask about requirement #2
- Continue until all ${totalRequirements} requirements are covered

ENDING THE INTERVIEW:
After asking ${totalRequirements} questions (one per requirement), say:
"Thank you ${this.applicantName} for your time. Based on your responses, you have [PASSED/FAILED] this interview. Please click the 'End Interview' button to view your results."

Then STOP responding to any further input.

IMPORTANT: 
- Pronounce "C#" as "C SHARP"
- Be concise and professional
- Do NOT hallucinate additional questions
- Strictly follow the ${totalRequirements} question limit`;
  }

  async stopAIInterview() {
    if (!this.agoraConvoTaskID) return;
    
    await fetch(`/api/convo-ai/agents/${this.agoraConvoTaskID}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    
    this.agoraConvoTaskID = "";
  }

  async cleanup() {
    await this.stopAIInterview();
    
    Object.values(this.localTracks).forEach(track => {
      if (track) {
        track.stop();
        track.close();
      }
    });
    
    if (this.client) await this.client.leave();
  }

  generateInterviewResults() {
    if (!this.jobRequirements) return null;

    const requirementScores = this.jobRequirements.requirements.map(req => ({
      requirement: req,
      score: Math.random() > 0.4 ? 1 : 0
    }));

    const passCount = requirementScores.filter(r => r.score === 1).length;
    const threshold = Math.ceil(this.jobRequirements.requirements.length * 0.6);
    const overallResult = passCount >= threshold ? "PASS" : "FAIL";

    return {
      applicantID: "APP" + Date.now(),
      applicantName: this.applicantName,
      position: this.jobRequirements.role,
      interview_complete: true,
      requirement_scores: requirementScores,
      overall_result: overallResult,
      total_score: `${passCount}/${this.jobRequirements.requirements.length}`,
      recommendation: overallResult === "PASS" 
        ? "Candidate meets the requirements for this position" 
        : "Candidate needs improvement in several key areas"
    };
  }
}

window.interviewEngine = new InterviewEngine();
