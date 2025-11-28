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
    this.conversationTranscript = [];
    this.aiVerdict = null;
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
      if (user.uid === 10001 || user.uid === 10002) {
        console.warn("⚠️ AI interviewer disconnected unexpectedly");
        this.handleInterviewerDisconnect();
      }
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
      const requirements = data.job_requirements.split('.').map(r => r.trim()).filter(r => r);
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

  generateInterviewPrompt() {
    if (!this.jobRequirements) {
      return "You are a professional AI interviewer. Ask relevant questions about the candidate's experience and skills. Keep responses concise and professional.";
    }

    const requirementsList = this.jobRequirements.requirements
      .map((req, index) => `${index + 1}. ${req}`)
      .join('. ');
    
    const totalRequirements = this.jobRequirements.requirements.length;

    console.log('🤖 Generated Interview Prompt for:', this.jobRequirements.role);

    return `You are an AI interviewer for the ${this.jobRequirements.role} position.

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
After asking ${totalRequirements} questions (one per requirement), provide your assessment:

If PASSED: "Thank you for your time, ${this.applicantName}. Based on your responses, you have PASSED this interview. You demonstrated strong knowledge and skills."

If FAILED: Speak in a calm, gentle, and supportive tone:
"Thank you for your time, ${this.applicantName}. I appreciate your effort today. Based on your responses, you have not met the requirements for this position at this time. However, I want to encourage you - this is an opportunity for growth. I recommend focusing on: [specific areas]. Consider studying [specific topics] and gaining hands-on experience with [specific skills]. With dedication and practice, you can definitely improve. Don't be discouraged - every interview is a learning experience."

Then say: "Please click the 'End Interview' button to view your detailed results."

IMPORTANT: 
- Use EXACTLY the words "PASSED" or "FAILED" (or "not met the requirements") in your final verdict
- When delivering a FAILED verdict, be empathetic, calm, gentle, and encouraging
- Pronounce "C#" as "C SHARP"
- Always give specific, constructive improvement advice if candidate fails
- Strictly follow the ${totalRequirements} question limit`;
  }

  async startAIInterview() {
    const requestData = {
      name: this.channelName,
      properties: {
        channel: this.channelName,
        agent_rtc_uid: "10001",
        remote_rtc_uids: ["10000"],
        idle_timeout: 60,
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
              speed: 0.95,
              vol: 1,
              pitch: 0,
              emotion: "calm"
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
            timeout_ms: 15000,
            action: "think",
            content: "continue conversation"
          },
          max_idle_time: 300
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

  addToTranscript(speaker, message) {
    this.conversationTranscript.push({ speaker, message, timestamp: Date.now() });
    console.log(`💬 ${speaker}: ${message.substring(0, 50)}...`);
    
    const msgUpper = message.toUpperCase();
    if (speaker === 'AI' && (msgUpper.includes('PASSED') || msgUpper.includes('FAILED') || msgUpper.includes('NOT MET THE REQUIREMENTS'))) {
      this.aiVerdict = msgUpper.includes('PASSED') ? 'PASS' : 'FAIL';
      console.log('🎯 AI Verdict captured:', this.aiVerdict, 'from message:', message);
    }
  }

  async extractInterviewResults() {
    console.log('📊 Extracting interview results...');
    console.log('📝 Total transcript messages:', this.conversationTranscript.length);
    console.log('🎯 Captured AI verdict:', this.aiVerdict);
    
    if (!this.jobRequirements) return null;

    let actualResult = this.aiVerdict;
    let aiMessage = '';
    
    if (!actualResult) {
      console.log('⚠️ No verdict captured, analyzing last 5 messages...');
      const lastMessages = this.conversationTranscript.slice(-5);
      lastMessages.forEach(msg => console.log(`  ${msg.speaker}: ${msg.message.substring(0, 80)}`));
      
      for (const msg of lastMessages) {
        if (msg.speaker === 'AI') {
          const msgLower = msg.message.toLowerCase();
          if (msgLower.includes('passed') || msgLower.includes('pass')) {
            actualResult = 'PASS';
            aiMessage = msg.message;
            console.log('✅ Found PASS in message');
            break;
          } else if (msgLower.includes('failed') || msgLower.includes('fail') || msgLower.includes('not met')) {
            actualResult = 'FAIL';
            aiMessage = msg.message;
            console.log('❌ Found FAIL in message');
            break;
          }
        }
      }
    }

    if (!actualResult) {
      actualResult = 'FAIL';
      console.warn('⚠️ No AI verdict found, defaulting to FAIL');
    }

    const categories = this.generateCategoryScores(actualResult);
    const overallScore = actualResult === 'PASS' ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40) + 20;
    const improvementTips = this.extractImprovementTips(aiMessage, actualResult);
    const feedback = this.generateResultFeedback(actualResult, overallScore, categories);

    const results = {
      applicant_id: JSON.parse(localStorage.getItem('interviewData') || '{}').applicant_id || "APP" + Date.now(),
      applicantName: this.applicantName,
      position: this.jobRequirements.role,
      overall_result: actualResult,
      overall_score: overallScore,
      category_scores: categories,
      ai_feedback: feedback,
      improvement_tips: improvementTips
    };

    console.log('📊 Final results:', results);
    return results;
  }

  generateCategoryScores(result) {
    const categories = ['Technical Skills', 'Communication', 'Experience'];
    return categories.map(cat => ({
      category: cat,
      status: result === 'PASS' ? (Math.random() > 0.3 ? 'Passed' : 'Failed') : (Math.random() > 0.7 ? 'Passed' : 'Failed')
    }));
  }

  extractImprovementTips(aiMessage, result) {
    if (result === 'PASS') {
      return 'Great job! Continue building on your strengths and stay updated with industry trends.';
    }
    
    if (aiMessage && aiMessage.includes('recommend')) {
      const advice = aiMessage.split('recommend')[1]?.split('.')[0];
      if (advice) return 'Focus on:' + advice;
    }
    
    return 'Consider strengthening your technical knowledge, practicing coding problems, and gaining more hands-on experience with relevant technologies.';
  }

  generateResultFeedback(result, score, categories) {
    const passed = categories.filter(c => c.status === 'Passed');
    const failed = categories.filter(c => c.status === 'Failed');
    
    let feedback = `You scored ${score}% overall. `;
    
    if (passed.length > 0) {
      feedback += `Strong areas: ${passed.map(c => c.category).join(', ')}. `;
    }
    
    if (failed.length > 0) {
      feedback += `Areas needing improvement: ${failed.map(c => c.category).join(', ')}. `;
    }
    
    return feedback;
  }

  async saveInterviewResults(results) {
    try {
      const interviewData = JSON.parse(localStorage.getItem('interviewData') || '{}');
      const applicant_id = interviewData.applicant_id || results.applicant_id;
      
      const payload = {
        applicant_id: applicant_id,
        score_overall: results.overall_score,
        eye_contact_score: Math.floor(Math.random() * 20) + 75,
        summary_text: results.ai_feedback,
        improvement_tips: results.improvement_tips
      };
      
      console.log('💾 Saving to database:', payload);
      
      const response = await fetch('/api/results/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const responseData = await response.json();
      console.log('📡 Server response:', responseData);
      
      if (response.ok) {
        console.log('✅ Results saved successfully');
        return true;
      } else {
        console.error('❌ Server returned error:', responseData);
        return false;
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      return false;
    }
  }

  async stopAIInterview() {
    if (!this.agoraConvoTaskID) return;
    
    await fetch(`/api/convo-ai/agents/${this.agoraConvoTaskID}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    
    this.agoraConvoTaskID = "";
  }

  handleInterviewerDisconnect() {
    if (window.addMsg) {
      window.addMsg("System", "AI interviewer disconnected. You can end the interview to view your results.");
    }
    
    const endBtn = document.getElementById("endBtn");
    if (endBtn) {
      endBtn.style.display = "block";
      endBtn.textContent = "End Interview & View Results";
    }
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
}

window.interviewEngine = new InterviewEngine();