// Test script for enhanced interview results
const mockJobRequirements = {
  role: "Senior Full Stack Developer",
  requirements: [
    "5+ years of JavaScript experience",
    "React framework expertise", 
    "Node.js backend development",
    "Database design skills",
    "API development experience",
    "Cloud deployment knowledge"
  ]
};

const mockApplicant = {
  applicant_id: "TEST_123",
  full_name: "John Doe",
  email: "john@example.com"
};

// Simulate the enhanced generateInterviewResults function
function generateInterviewResults(jobRequirements, applicantName) {
  if (!jobRequirements) return null;

  // Generate realistic scores based on requirement keywords
  const requirementScores = jobRequirements.requirements.map(req => {
    const keywords = req.toLowerCase();
    let baseScore = 0.5;
    
    // Adjust probability based on requirement complexity
    if (keywords.includes('senior') || keywords.includes('lead') || keywords.includes('architect')) baseScore = 0.3;
    else if (keywords.includes('junior') || keywords.includes('entry')) baseScore = 0.8;
    else if (keywords.includes('experience') || keywords.includes('years')) baseScore = 0.6;
    else if (keywords.includes('framework') || keywords.includes('library')) baseScore = 0.4;
    
    return {
      requirement: req,
      score: Math.random() < baseScore ? 1 : 0,
      category: categorizeRequirement(req)
    };
  });

  // Calculate category-based scores
  const categories = calculateCategoryScores(requirementScores);
  const passCount = requirementScores.filter(r => r.score === 1).length;
  const threshold = Math.ceil(jobRequirements.requirements.length * 0.6);
  const overallResult = passCount >= threshold ? "PASS" : "FAIL";
  const overallScore = Math.round((passCount / jobRequirements.requirements.length) * 100);

  // Generate AI feedback
  const feedback = generateAIFeedback(categories, overallResult, overallScore);

  return {
    applicant_id: mockApplicant.applicant_id,
    applicantName: applicantName,
    position: jobRequirements.role,
    interview_complete: true,
    requirement_scores: requirementScores,
    category_scores: categories,
    overall_result: overallResult,
    overall_score: overallScore,
    total_score: `${passCount}/${jobRequirements.requirements.length}`,
    ai_feedback: feedback,
    recommendation: overallResult === "PASS" 
      ? "Candidate meets the requirements and is recommended for next round" 
      : "Candidate needs improvement in key technical areas"
  };
}

function categorizeRequirement(requirement) {
  const req = requirement.toLowerCase();
  if (req.includes('experience') || req.includes('years') || req.includes('background')) return 'Experience';
  if (req.includes('framework') || req.includes('library') || req.includes('tool')) return 'Frameworks';
  if (req.includes('skill') || req.includes('knowledge') || req.includes('understanding')) return 'Skills';
  if (req.includes('degree') || req.includes('education') || req.includes('certification')) return 'Background';
  return 'Technical';
}

function calculateCategoryScores(requirementScores) {
  const categories = {};
  requirementScores.forEach(req => {
    if (!categories[req.category]) {
      categories[req.category] = { total: 0, passed: 0 };
    }
    categories[req.category].total++;
    if (req.score === 1) categories[req.category].passed++;
  });

  return Object.keys(categories).map(cat => ({
    category: cat,
    score: categories[cat].passed,
    total: categories[cat].total,
    status: categories[cat].passed >= Math.ceil(categories[cat].total * 0.5) ? 'Passed' : 'Failed'
  }));
}

function generateAIFeedback(categories, result, score) {
  const strengths = categories.filter(c => c.status === 'Passed').map(c => c.category);
  const weaknesses = categories.filter(c => c.status === 'Failed').map(c => c.category);
  
  let feedback = `You scored ${score}% overall. `;
  
  if (strengths.length > 0) {
    feedback += `Strong performance in <strong>${strengths.join(', ')}</strong>. `;
  }
  
  if (weaknesses.length > 0) {
    feedback += `Areas for improvement: <strong>${weaknesses.join(', ')}</strong>. `;
  }
  
  if (result === 'PASS') {
    feedback += 'You demonstrate solid technical competency for this role.';
  } else {
    feedback += 'Consider strengthening your knowledge in the highlighted areas.';
  }
  
  return feedback;
}

// Run test
console.log('🧪 Testing Enhanced Interview Results Generation\n');
const results = generateInterviewResults(mockJobRequirements, mockApplicant.full_name);

console.log('📊 Generated Results:');
console.log('Position:', results.position);
console.log('Overall Score:', results.overall_score + '%');
console.log('Result:', results.overall_result);
console.log('\n📋 Category Breakdown:');
results.category_scores.forEach(cat => {
  console.log(`  ${cat.category}: ${cat.score}/${cat.total} (${cat.status})`);
});
console.log('\n🤖 AI Feedback:');
console.log(results.ai_feedback.replace(/<\/?strong>/g, ''));
console.log('\n✅ Test completed successfully!');