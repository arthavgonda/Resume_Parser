import React, { useState, useRef } from 'react';
import { Upload, FileText, Search, Briefcase, User, Mail, Phone, MapPin, Award, Code, Clock, ExternalLink, CheckCircle, XCircle, Star, TrendingUp } from 'lucide-react';

const ResumeAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // API Base URL - Updated to match FastAPI default
  const API_BASE_URL = 'http://localhost:8000'; // Changed from 0.0.0.0 to localhost

  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    // Validate file type
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(uploadedFile.type)) {
      setError('Please upload a PDF or DOCX file');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (uploadedFile.size > maxSize) {
      setError('File size too large. Maximum 10MB allowed.');
      return;
    }

    setFile(uploadedFile);
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      console.log('Uploading file:', uploadedFile.name);

      const response = await fetch(`${API_BASE_URL}/upload-resume`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setAnalysis(data.analysis);
        setJobs(data.job_matches || []);
        setActiveTab('analysis');
      } else {
        throw new Error(data.message || 'Analysis failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      let errorMessage = 'Failed to analyze resume.';
      
      if (err.message.includes('fetch')) {
        errorMessage = 'Cannot connect to the backend server. Please ensure the server is running on http://localhost:8000';
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTextAnalysis = async (text) => {
    if (!text.trim()) {
      setError('Please enter resume text');
      return;
    }

    if (text.trim().length < 50) {
      setError('Resume text is too short. Please provide more content.');
      return;
    }

    setLoading(true);
    setError(null);
    setResumeText(text);

    try {
      console.log('Analyzing text...');

      const response = await fetch(`${API_BASE_URL}/analyze-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.trim() }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setAnalysis(data.analysis);
        setJobs(data.job_matches || []);
        setActiveTab('analysis');
      } else {
        throw new Error(data.message || 'Analysis failed');
      }
    } catch (err) {
      console.error('Text analysis error:', err);
      let errorMessage = 'Failed to analyze resume text.';
      
      if (err.message.includes('fetch')) {
        errorMessage = 'Cannot connect to the backend server. Please ensure the server is running on http://localhost:8000';
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const TextInputSection = () => {
    const [text, setText] = useState('');

    return (
      <div style={styles.textInputSection}>
        <div style={styles.textInputCard}>
          <h3 style={styles.textInputTitle}>Paste Your Resume Text</h3>
          <p style={styles.textInputSubtitle}>Copy and paste your resume content below for instant analysis</p>
          <textarea
            style={styles.textarea}
            rows="12"
            placeholder="Paste your resume text here...

Example:
Andy
Andy.Ji@email.com
+91 1234567890
Deehradun, India
\n
Professional Summary
Experienced full-stack developer with 5+ years of expertise in modern web technologies...

Technical Skills
JavaScript, React, Node.js, Python, AWS, Docker...

Experience
Senior Software Developer - TechCorp Inc. (2020-Present)
..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div style={styles.textStats}>
            <span style={styles.charCount}>
              {text.length} characters {text.length >= 50 ? '✓' : `(minimum 50 required)`}
            </span>
          </div>
          <button
            style={{
              ...styles.analyzeButton,
              opacity: text.trim().length < 50 ? 0.6 : 1,
              cursor: text.trim().length < 50 ? 'not-allowed' : 'pointer'
            }}
            onClick={() => handleTextAnalysis(text)}
            onMouseOver={(e) => {
              if (text.trim().length >= 50) {
                e.target.style.background = styles.analyzeButtonHover.background;
              }
            }}
            onMouseOut={(e) => e.target.style.background = styles.analyzeButton.background}
            disabled={loading || text.trim().length < 50}
          >
            {loading ? 'Analyzing...' : 'Analyze Resume Text'}
          </button>
        </div>
      </div>
    );
  };

  const UploadSection = () => (
    <div style={styles.uploadSection}>
      {error && (
        <div style={styles.errorMessage}>
          <XCircle size={20} style={{ marginRight: '8px', color: '#dc2626' }} />
          <p style={styles.errorText}>{error}</p>
        </div>
      )}
      <div 
        style={styles.uploadArea}
        onClick={() => fileInputRef.current?.click()}
        onMouseOver={(e) => {
          e.target.style.borderColor = '#3b82f6';
          e.target.style.background = 'rgba(59, 130, 246, 0.02)';
        }}
        onMouseOut={(e) => {
          e.target.style.borderColor = '#d1d5db';
          e.target.style.background = 'rgba(255, 255, 255, 0.95)';
        }}
      >
        <Upload size={48} style={styles.uploadIcon} />
        <h3 style={styles.uploadTitle}>Upload Your Resume</h3>
        <p style={styles.uploadText}>
          Drop your resume here or click to browse
        </p>
        <p style={styles.uploadSubtext}>
          Supports PDF and DOCX files • Maximum 10MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          disabled={loading}
        />
      </div>
      {file && (
        <div style={styles.fileSelected}>
          <CheckCircle size={20} style={{ color: '#059669', marginRight: '8px' }} />
          <span style={{ color: '#059669', fontWeight: '600' }}>Selected: {file.name}</span>
          <span style={{ color: '#6b7280', marginLeft: '8px' }}>
            ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </span>
        </div>
      )}
    </div>
  );

  const AnalysisSection = () => (
    <div style={styles.analysisContainer}>
      {/* Contact Info */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <User size={20} style={{ marginRight: '8px', color: '#2563eb' }} />
          Contact Information
        </h3>
        <div style={styles.contactGrid}>
          <div style={styles.contactItem}>
            <User size={16} style={{ marginRight: '8px', color: '#6b7280' }} />
            <span>{analysis?.contact?.name || 'Not detected'}</span>
          </div>
          <div style={styles.contactItem}>
            <Mail size={16} style={{ marginRight: '8px', color: '#6b7280' }} />
            <span>{analysis?.contact?.email || 'Not detected'}</span>
          </div>
          <div style={styles.contactItem}>
            <Phone size={16} style={{ marginRight: '8px', color: '#6b7280' }} />
            <span>{analysis?.contact?.phone || 'Not detected'}</span>
          </div>
          <div style={styles.contactItem}>
            <MapPin size={16} style={{ marginRight: '8px', color: '#6b7280' }} />
            <span>{analysis?.contact?.location || 'Not detected'}</span>
          </div>
        </div>
      </div>

      {/* Resume Score */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <Award size={20} style={{ marginRight: '8px', color: '#2563eb' }} />
          Resume Quality Score
        </h3>
        <div style={styles.scoreContainer}>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${analysis?.score || 0}%`,
                background: analysis?.score >= 80 ? '#10b981' : 
                           analysis?.score >= 60 ? '#f59e0b' : '#ef4444'
              }}
            ></div>
          </div>
          <span style={{
            ...styles.scoreText,
            color: analysis?.score >= 80 ? '#059669' : 
                   analysis?.score >= 60 ? '#d97706' : '#dc2626'
          }}>
            {analysis?.score || 0}/100
          </span>
        </div>
        <div style={styles.scoreDescription}>
          {analysis?.score >= 90 && "Excellent resume! Very well structured and comprehensive."}
          {analysis?.score >= 80 && analysis?.score < 90 && "Great resume! Minor improvements could make it even better."}
          {analysis?.score >= 60 && analysis?.score < 80 && "Good resume! Some areas could be enhanced."}
          {analysis?.score < 60 && "Your resume needs improvement. Consider adding more details."}
        </div>
      </div>

      {/* Technical Skills */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <Code size={20} style={{ marginRight: '8px', color: '#2563eb' }} />
          Technical Skills ({analysis?.skills?.length || 0})
        </h3>
        <div style={styles.skillsContainer}>
          {analysis?.skills?.length > 0 ? (
            analysis.skills.map((skill, index) => (
              <span 
                key={index}
                style={styles.skillTag}
              >
                {skill}
              </span>
            ))
          ) : (
            <div style={styles.noSkillsMessage}>
              <Code size={24} style={{ color: '#9ca3af', marginBottom: '8px' }} />
              <p>No technical skills detected. Try including programming languages, frameworks, or tools in your resume.</p>
            </div>
          )}
        </div>
      </div>

      {/* Professional Summary */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <FileText size={20} style={{ marginRight: '8px', color: '#2563eb' }} />
          Professional Summary
        </h3>
        <p style={styles.summaryText}>
          {analysis?.professional_summary || analysis?.summary || 'No professional summary detected. Consider adding a summary section to highlight your key qualifications.'}
        </p>
      </div>

      {/* Experience */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <Briefcase size={20} style={{ marginRight: '8px', color: '#2563eb' }} />
          Work Experience
        </h3>
        <div style={styles.experienceGrid}>
          <div style={styles.experienceItem}>
            <Clock size={16} style={{ marginRight: '8px', color: '#6b7280' }} />
            <div>
              <strong>Experience:</strong> {analysis?.experience?.years || 0} years
            </div>
          </div>
          <div style={styles.experienceItem}>
            <TrendingUp size={16} style={{ marginRight: '8px', color: '#6b7280' }} />
            <div>
              <strong>Level:</strong> {analysis?.experience?.level || 'Not determined'}
            </div>
          </div>
        </div>
        
        {analysis?.experience?.job_titles?.length > 0 && (
          <div style={styles.jobTitlesSection}>
            <h4 style={styles.subsectionTitle}>Job Titles:</h4>
            <div style={styles.jobTitlesList}>
              {analysis.experience.job_titles.map((title, index) => (
                <span key={index} style={styles.jobTitleTag}>{title}</span>
              ))}
            </div>
          </div>
        )}

        {analysis?.experience?.companies?.length > 0 && (
          <div style={styles.companiesSection}>
            <h4 style={styles.subsectionTitle}>Companies:</h4>
            <div style={styles.companiesList}>
              {analysis.experience.companies.map((company, index) => (
                <span key={index} style={styles.companyTag}>{company}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Education */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <Award size={20} style={{ marginRight: '8px', color: '#2563eb' }} />
          Education
        </h3>
        <div style={styles.educationGrid}>
          {analysis?.education?.highest_degree && (
            <div style={styles.educationItem}>
              <strong>Highest Degree:</strong> {analysis.education.highest_degree}
            </div>
          )}
          {analysis?.education?.field_of_study && (
            <div style={styles.educationItem}>
              <strong>Field of Study:</strong> {analysis.education.field_of_study}
            </div>
          )}
          {analysis?.education?.institution && (
            <div style={styles.educationItem}>
              <strong>Institution:</strong> {analysis.education.institution}
            </div>
          )}
          {analysis?.education?.graduation_year && (
            <div style={styles.educationItem}>
              <strong>Graduation:</strong> {analysis.education.graduation_year}
            </div>
          )}
          
          {!analysis?.education?.highest_degree && 
           !analysis?.education?.field_of_study && 
           !analysis?.education?.institution && (
            <div style={styles.noEducationMessage}>
              <p>No education information detected. Consider adding your educational background.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const JobsSection = () => (
    <div style={styles.jobsContainer}>
      <div style={styles.jobsHeader}>
        <h3 style={styles.jobsTitle}>
          <Star size={32} style={{ marginRight: '12px' }} />
          Job Matches for You
        </h3>
        <p style={styles.jobsSubtitle}>
          Found {jobs.length} jobs matching your profile
        </p>
      </div>

      {jobs.length === 0 ? (
        <div style={styles.noJobsMessage}>
          <Briefcase size={48} style={{ color: '#9ca3af', marginBottom: '16px' }} />
          <h4>No matching jobs found</h4>
          <p>Try uploading a different resume or improving your skills section to get better job matches.</p>
        </div>
      ) : (
        jobs.map((job) => (
          <div key={job.job_id} style={styles.jobCard}>
            <div style={styles.jobHeader}>
              <div>
                <h4 style={styles.jobTitle}>
                  {job.title}
                </h4>
                <p style={styles.jobCompany}>
                  <Briefcase size={16} style={{ marginRight: '4px' }} />
                  {job.company}
                </p>
              </div>
              <div style={{
                ...styles.matchBadge,
                background: job.match_percentage >= 90 ? '#dcfce7' : 
                           job.match_percentage >= 80 ? '#fef3c7' : 
                           job.match_percentage >= 70 ? '#fed7aa' : '#f3f4f6',
                color: job.match_percentage >= 90 ? '#166534' : 
                       job.match_percentage >= 80 ? '#92400e' : 
                       job.match_percentage >= 70 ? '#c2410c' : '#374151'
              }}>
                <Star size={14} style={{ marginRight: '4px' }} />
                {job.match_percentage}% Match
              </div>
            </div>

            <div style={styles.jobDetails}>
              <div style={styles.jobDetail}>
                <MapPin size={16} style={{ marginRight: '8px' }} />
                {job.location}
              </div>
              <div style={styles.jobDetail}>
                <Clock size={16} style={{ marginRight: '8px' }} />
                {job.experience_required}
              </div>
              <div style={{ ...styles.jobDetail, fontWeight: '600', color: '#059669' }}>
                💰 {job.salary_range}
              </div>
              {job.remote && (
                <div style={styles.jobDetail}>
                  🏠 Remote Work
                </div>
              )}
            </div>

            <div style={styles.skillsSection}>
              <h5 style={styles.skillsTitle}>Required Skills:</h5>
              <div style={styles.skillsContainer}>
                {job.required_skills?.map((skill, index) => {
                  const isMatched = analysis?.skills?.some(s => 
                    s.toLowerCase().includes(skill.toLowerCase()) ||
                    skill.toLowerCase().includes(s.toLowerCase())
                  );
                  return (
                    <span 
                      key={index}
                      style={{
                        ...styles.jobSkillTag,
                        background: isMatched ? '#dcfce7' : '#f3f4f6',
                        color: isMatched ? '#166534' : '#6b7280',
                        border: isMatched ? '1px solid #bbf7d0' : '1px solid #e5e7eb'
                      }}
                    >
                      {isMatched && <CheckCircle size={12} style={{ marginRight: '4px' }} />}
                      {skill}
                    </span>
                  );
                }) || []}
              </div>
            </div>

            <p style={styles.jobDescription}>{job.description}</p>

            <button 
              style={styles.applyButton}
              onMouseOver={(e) => e.target.style.background = styles.applyButtonHover.background}
              onMouseOut={(e) => e.target.style.background = styles.applyButton.background}
              onClick={() => {
                // In a real app, this would open the job application page
                alert('In a real application, this would redirect to the job application page!');
              }}
            >
              <ExternalLink size={16} style={{ marginRight: '8px' }} />
              Apply Now
            </button>
          </div>
        ))
      )}
    </div>
  );

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    header: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '80px'
    },
    headerTitle: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e293b',
      margin: 0
    },
    nav: {
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
    },
    navContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 24px',
      display: 'flex',
      gap: '32px'
    },
    navButton: {
      padding: '16px 4px',
      border: 'none',
      background: 'none',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      borderBottom: '2px solid transparent',
      transition: 'all 0.3s ease',
      color: '#6b7280'
    },
    navButtonActive: {
      borderBottomColor: '#3b82f6',
      color: '#2563eb'
    },
    main: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px 24px'
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '80px 0'
    },
    spinner: {
      width: '48px',
      height: '48px',
      border: '4px solid rgba(59, 130, 246, 0.2)',
      borderTop: '4px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 16px'
    },
    loadingText: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '16px',
      fontWeight: '500'
    },
    errorMessage: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '24px',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center'
    },
    errorText: {
      color: '#dc2626',
      margin: 0,
      fontSize: '14px'
    },
    uploadSection: {
      textAlign: 'center',
      padding: '80px 0'
    },
    uploadArea: {
      border: '3px dashed #d1d5db',
      borderRadius: '16px',
      padding: '64px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
    },
    uploadIcon: {
      color: '#9ca3af',
      marginBottom: '16px'
    },
    uploadTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
      margin: '0 0 8px 0'
    },
    uploadText: {
      color: '#6b7280',
      margin: '0 0 16px 0',
      fontSize: '16px'
    },
    uploadSubtext: {
      color: '#9ca3af',
      fontSize: '14px',
      margin: 0
    },
    fileSelected: {
      marginTop: '24px',
      padding: '16px 24px',
      background: 'rgba(16, 185, 129, 0.1)',
      borderRadius: '12px',
      display: 'inline-flex',
      alignItems: 'center',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(16, 185, 129, 0.2)'
    },
    textInputSection: {
      textAlign: 'center',
      padding: '40px 0'
    },
    textInputCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      textAlign: 'left'
    },
    textInputTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#111827',
      margin: '0 0 8px 0',
      textAlign: 'center'
    },
    textInputSubtitle: {
      color: '#6b7280',
      margin: '0 0 24px 0',
      textAlign: 'center'
    },
    textarea: {
      width: '100%',
      padding: '20px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      fontSize: '14px',
      background: '#ffffff',
      resize: 'vertical',
      fontFamily: 'monospace',
      outline: 'none',
      transition: 'all 0.3s ease',
      lineHeight: '1.5'
    },
    textStats: {
      marginTop: '8px',
      textAlign: 'right'
    },
    charCount: {
      fontSize: '12px',
      color: '#6b7280'
    },
    analyzeButton: {
      marginTop: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '12px 32px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
      width: '100%'
    },
    analyzeButtonHover: {
      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
    },
    analysisContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    card: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    cardTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
      margin: '0 0 24px 0',
      display: 'flex',
      alignItems: 'center'
    },
    contactGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px'
    },
    contactItem: {
      display: 'flex',
      alignItems: 'center',
      color: '#374151',
      padding: '8px 0'
    },
    scoreContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      marginBottom: '16px'
    },
    progressBar: {
      flex: 1,
      height: '12px',
      background: '#e5e7eb',
      borderRadius: '6px',
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      borderRadius: '6px',
      transition: 'width 1s ease-in-out'
    },
    scoreText: {
      fontSize: '24px',
      fontWeight: '700'
    },
    scoreDescription: {
      color: '#6b7280',
      fontSize: '14px',
      fontStyle: 'italic'
    },
    skillsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px'
    },
    skillTag: {
      padding: '8px 16px',
      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      color: '#1e40af',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '500',
      border: '1px solid #bfdbfe'
    },
    noSkillsMessage: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#6b7280'
    },
    summaryText: {
      color: '#4b5563',
      lineHeight: '1.7',
      margin: 0,
      fontSize: '16px'
    },
    experienceGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '20px'
    },
    experienceItem: {
      display: 'flex',
      alignItems: 'center',
      color: '#374151',
      padding: '8px 0'
    },
    jobTitlesSection: {
      marginTop: '20px'
    },
    companiesSection: {
      marginTop: '16px'
    },
    subsectionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#111827',
      margin: '0 0 12px 0'
    },
    jobTitlesList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px'
    },
    jobTitleTag: {
      padding: '6px 12px',
      background: '#f3f4f6',
      color: '#374151',
      borderRadius: '16px',
      fontSize: '13px',
      fontWeight: '500'
    },
    companiesList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px'
    },
    companyTag: {
      padding: '6px 12px',
      background: '#ede9fe',
      color: '#6b46c1',
      borderRadius: '16px',
      fontSize: '13px',
      fontWeight: '500'
    },
    educationGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px'
    },
    educationItem: {
      color: '#4b5563',
      padding: '8px 0',
      lineHeight: '1.5'
    },
    noEducationMessage: {
      color: '#6b7280',
      fontStyle: 'italic'
    },
    jobsContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    jobsHeader: {
      textAlign: 'center',
      marginBottom: '32px'
    },
    jobsTitle: {
      fontSize: '32px',
      fontWeight: '700',
      color: 'white',
      margin: '0 0 8px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    jobsSubtitle: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '18px',
      margin: 0
    },
    noJobsMessage: {
      textAlign: 'center',
      padding: '60px 40px',
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '16px',
      color: '#6b7280'
    },
    jobCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'all 0.3s ease'
    },
    jobHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '16px'
    },
    jobTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#111827',
      margin: '0 0 8px 0'
    },
    jobCompany: {
      color: '#6b7280',
      display: 'flex',
      alignItems: 'center',
      margin: 0
    },
    matchBadge: {
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      whiteSpace: 'nowrap'
    },
    jobDetails: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    },
    jobDetail: {
      display: 'flex',
      alignItems: 'center',
      color: '#6b7280',
      fontSize: '14px'
    },
    skillsSection: {
      marginBottom: '24px'
    },
    skillsTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#111827',
      margin: '0 0 12px 0'
    },
    jobSkillTag: {
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center'
    },
    jobDescription: {
      color: '#4b5563',
      lineHeight: '1.6',
      margin: '0 0 24px 0'
    },
    applyButton: {
      width: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
    },
    applyButtonHover: {
      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        * {
          box-sizing: border-box;
        }
        
        textarea:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
        
        @media (max-width: 768px) {
          .nav-content {
            flex-direction: column;
            gap: 16px !important;
          }
          
          .job-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          
          .contact-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.headerTitle}>
            <Search size={32} style={{ marginRight: '12px', color: '#3b82f6' }} />
            AI Resume Analyzer
          </h1>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Powered by Enhanced AI
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={styles.nav}>
        <div style={styles.navContent} className="nav-content">
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'upload' ? styles.navButtonActive : {})
            }}
          >
            📎 Upload Resume
          </button>
          <button
            onClick={() => setActiveTab('text')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'text' ? styles.navButtonActive : {})
            }}
          >
            📝 Paste Text
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'analysis' ? styles.navButtonActive : {}),
              opacity: !analysis ? 0.5 : 1,
              cursor: !analysis ? 'not-allowed' : 'pointer'
            }}
            disabled={!analysis}
          >
            📊 Analysis {analysis && '✓'}
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'jobs' ? styles.navButtonActive : {}),
              opacity: jobs.length === 0 ? 0.5 : 1,
              cursor: jobs.length === 0 ? 'not-allowed' : 'pointer'
            }}
            disabled={jobs.length === 0}
          >
            💼 Jobs ({jobs.length})
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>
              🤖 Analyzing your resume with AI...
            </p>
            <p style={{ ...styles.loadingText, fontSize: '14px', opacity: 0.7, marginTop: '8px' }}>
              This may take a few seconds
            </p>
          </div>
        )}

        {!loading && (
          <>
            {activeTab === 'upload' && <UploadSection />}
            {activeTab === 'text' && <TextInputSection />}
            {activeTab === 'analysis' && analysis && <AnalysisSection />}
            {activeTab === 'jobs' && jobs.length > 0 && <JobsSection />}
            
            {/* Show message if trying to view analysis/jobs without data */}
            {activeTab === 'analysis' && !analysis && (
              <div style={styles.noJobsMessage}>
                <FileText size={48} style={{ color: '#9ca3af', marginBottom: '16px' }} />
                <h4>No Analysis Available</h4>
                <p>Please upload a resume or paste resume text first to see the analysis.</p>
              </div>
            )}
            
            {activeTab === 'jobs' && jobs.length === 0 && !analysis && (
              <div style={styles.noJobsMessage}>
                <Briefcase size={48} style={{ color: '#9ca3af', marginBottom: '16px' }} />
                <h4>No Jobs Available</h4>
                <p>Please analyze a resume first to see matching job opportunities.</p>
              </div>
            )}
          </>
        )}
      </main>
      
      {/* Footer with connection status */}
      <div style={{
        textAlign: 'center',
        padding: '20px',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '12px'
      }}>
        Backend: {API_BASE_URL} 
        {error && error.includes('connect') && (
          <span style={{ color: '#fbbf24', marginLeft: '8px' }}>
            ⚠️ Connection Issue
          </span>
        )}
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
