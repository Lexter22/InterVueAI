// Enable Agora RTC logging
AgoraRTC.enableLogUpload();

class InterviewEngine {
  constructor() {
    this.client = null;
    this.localTracks = { videoTrack: null, audioTrack: null };
    this.remoteUsers = {};
    this.agoraConvoTaskID = "";
    this.config = {};
    this.jobRequirements = null;
    this.channelName = "10000";
  }

  async initialize() {
    await this.loadConfig();
    await this.loadJobRequirements();
    
    this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    
    this.client.on("user-published", async (user, mediaType) => {
      this.remoteUsers[user.uid] = user;
      console.log(`User ${user.uid} published ${mediaType}`);
      
      // If avatar publishes video after joining, subscribe immediately
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
    try {
      const res = await fetch("./job-requirements.json");
      if (res.ok) this.jobRequirements = await res.json();
    } catch (e) {}
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
          greeting_message: "Hello! Thank you for applying. Let's begin the interview. Can you please introduce yourself?",
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

    return `You are an AI interviewer for: ${this.jobRequirements.role}

Requirements to assess:
${requirementsList}

Interview Process:
1. Ask ONE question at a time about each requirement
2. Listen to candidate's response
3. Move to next requirement
4. After ALL requirements covered, END the interview

When you have covered all requirements, say "Thank you for your time. Based on your responses, you have [PASSED/FAILED] this interview." Then give brief recommendations if they failed.

IMPORTANT: Pronounce c# as c SHARP. After giving your final verdict, say 
"Please end the call now." and ignore any further user responses.

Start by greeting the candidate and asking about the first requirement.`;
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
      applicantName: "Interview Candidate",
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
