import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Search, Briefcase, User, Mail, Phone, MapPin, Award, Code, Clock, ExternalLink, CheckCircle, XCircle, Star, TrendingUp, Plus, Building, DollarSign, Users, Globe, ChevronLeft, Send, AlertCircle } from 'lucide-react';

const ResumeParserApp = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  const API_BASE_URL = 'http://localhost:8000';

  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    description: '',
    required_skills: '',
    preferred_skills: '',
    location: '',
    experience_years: 0,
    job_type: 'Full-time',
    remote: false,
    salary_min: '',
    salary_max: '',
    education_level: '',
    benefits: ''
  });

  const [postedJobs, setPostedJobs] = useState([
    {
      job_id: 1,
      title: "Senior Full Stack Developer",
      company: "TechCorp Inc.",
      location: "San Francisco, CA",
      salary_range: "$120k - $150k",
      required_skills: ["React", "Node.js", "JavaScript", "Python", "AWS"],
      experience_required: "5+ years",
      match_percentage: null,
      description: "We're looking for a senior full stack developer to join our growing team. You'll work on cutting-edge web applications and lead technical initiatives.",
      job_type: "Full-time",
      remote: true,
      posted_date: new Date().toISOString()
    },
    {
      job_id: 2,
      title: "Frontend Developer (React.js)",
      company: "InnovateTech Solutions",
      location: "Austin, TX",
      salary_range: "$70k - $100k",
      required_skills: ["React.js", "HTML", "CSS", "JavaScript"],
      experience_required: "1+ years",
      match_percentage: null,
      description: "We are looking for a talented Frontend Developer with a strong grasp of modern JavaScript frameworks. The ideal candidate will take ownership of UI/UX implementations and collaborate with backend engineers and designers. You should be passionate about building intuitive and responsive user interfaces.",
      job_type: "Full-time",
      remote: false,
      posted_date: new Date().toISOString()
    }
  ]);

  useEffect(() => {
    if (currentView === 'jobSeeker') {
      setJobs(postedJobs);
    }
  }, [currentView, postedJobs]);

  const calculateMatchPercentage = (userSkills, jobSkills) => {
    if (!userSkills || !userSkills.length || !jobSkills || !jobSkills.length) {
      return 0;
    }

    const userSkillsLower = userSkills.map(skill => skill.toLowerCase().trim());
    let matchedSkills = 0;
    let totalPossibleMatches = jobSkills.length;

    jobSkills.forEach(jobSkill => {
      const jobSkillLower = jobSkill.toLowerCase().trim();
      
      if (userSkillsLower.includes(jobSkillLower)) {
        matchedSkills += 1;
        return;
      }
      
      const hasPartialMatch = userSkillsLower.some(userSkill => {
        const skillVariations = [
          userSkill,
          userSkill.replace(/\.js$/, ''),
          userSkill.replace(/js$/, ''),
          userSkill + '.js',
          userSkill + 'js'
        ];
        
        const jobSkillVariations = [
          jobSkillLower,
          jobSkillLower.replace(/\.js$/, ''),
          jobSkillLower.replace(/js$/, ''),
          jobSkillLower + '.js',
          jobSkillLower + 'js'
        ];
        
        return skillVariations.some(sv => jobSkillVariations.some(jsv => 
          sv.includes(jsv) || jsv.includes(sv)
        ));
      });
      
      if (hasPartialMatch) {
        matchedSkills += 0.8;
      }
    });

    const skillBonus = Math.min(userSkills.length / jobSkills.length, 1.5) - 1;
    const baseScore = (matchedSkills / totalPossibleMatches) * 100;
    const finalScore = Math.min(baseScore + (skillBonus * 10), 100);
    
    return Math.round(Math.max(finalScore, 0));
  };

  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(uploadedFile.type)) {
      setError('Please upload a PDF or DOCX file');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
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

      const response = await fetch(`${API_BASE_URL}/upload-resume`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
        
        const updatedJobs = postedJobs.map(job => {
          const backendMatch = data.job_matches?.find(j => j.job_id === job.job_id);
          if (backendMatch) {
            return { ...job, match_percentage: backendMatch.match_percentage };
          }
          
          const matchPercentage = calculateMatchPercentage(data.analysis.skills, job.required_skills);
          return { ...job, match_percentage: matchPercentage };
        });
        
        setJobs(updatedJobs);
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
    if (!text.trim() || text.trim().length < 50) {
      setError('Please enter resume text (minimum 50 characters)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
        
        const updatedJobs = postedJobs.map(job => {
          const backendMatch = data.job_matches?.find(j => j.job_id === job.job_id);
          if (backendMatch) {
            return { ...job, match_percentage: backendMatch.match_percentage };
          }
          
          const matchPercentage = calculateMatchPercentage(data.analysis.skills, job.required_skills);
          return { ...job, match_percentage: matchPercentage };
        });
        
        setJobs(updatedJobs);
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

  const handleEmployerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const newJob = {
        job_id: Date.now(),
        title: jobForm.title,
        company: jobForm.company,
        location: jobForm.location,
        salary_range: jobForm.salary_min && jobForm.salary_max 
          ? `$${parseInt(jobForm.salary_min)/1000}k - $${parseInt(jobForm.salary_max)/1000}k`
          : 'Salary not specified',
        required_skills: jobForm.required_skills.split(',').map(s => s.trim()).filter(s => s),
        preferred_skills: jobForm.preferred_skills.split(',').map(s => s.trim()).filter(s => s),
        experience_required: `${jobForm.experience_years}+ years`,
        match_percentage: null,
        description: jobForm.description,
        job_type: jobForm.job_type,
        remote: jobForm.remote,
        posted_date: new Date().toISOString(),
        education_level: jobForm.education_level,
        benefits: jobForm.benefits.split(',').map(s => s.trim()).filter(s => s)
      };

      setPostedJobs(prev => [...prev, newJob]);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Job posted successfully! It will be visible to job seekers immediately.');
      
      setJobForm({
        title: '',
        company: '',
        description: '',
        required_skills: '',
        preferred_skills: '',
        location: '',
        experience_years: 0,
        job_type: 'Full-time',
        remote: false,
        salary_min: '',
        salary_max: '',
        education_level: '',
        benefits: ''
      });
    } catch (err) {
      setError('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      background: '#000000',
      color: '#ffffff'
    },
    header: {
      background: 'rgba(28, 28, 30, 0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '0.5px solid rgba(255, 255, 255, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '60px'
    },
    headerTitle: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '22px',
      fontWeight: '600',
      color: '#ffffff',
      margin: 0,
      cursor: 'pointer',
      letterSpacing: '-0.022em'
    },
    backButton: {
      display: 'flex',
      alignItems: 'center',
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'none',
      color: '#ffffff',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '400',
      padding: '8px 16px',
      borderRadius: '20px',
      transition: 'all 0.2s ease',
      backdropFilter: 'blur(10px)'
    },
    landingContainer: {
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      background: 'linear-gradient(180deg, #000000 0%, #1a1a1a 100%)'
    },
    landingContent: {
      textAlign: 'center',
      maxWidth: '900px'
    },
    landingTitle: {
      fontSize: '72px',
      fontWeight: '700',
      color: '#ffffff',
      margin: '0 0 16px 0',
      lineHeight: '1.05',
      letterSpacing: '-0.025em'
    },
    landingSubtitle: {
      fontSize: '28px',
      color: 'rgba(255, 255, 255, 0.8)',
      margin: '0 0 64px 0',
      lineHeight: '1.2',
      fontWeight: '400',
      letterSpacing: '-0.01em'
    },
    userTypeGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '32px',
      maxWidth: '800px',
      margin: '0 auto'
    },
    userTypeCard: {
      background: 'rgba(28, 28, 30, 0.6)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '48px 32px',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      border: '0.5px solid rgba(255, 255, 255, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    },
    userTypeIcon: {
      marginBottom: '24px',
      color: '#007AFF'
    },
    userTypeTitle: {
      fontSize: '28px',
      fontWeight: '600',
      color: '#ffffff',
      margin: '0 0 12px 0',
      letterSpacing: '-0.01em'
    },
    userTypeDescription: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '18px',
      lineHeight: '1.4',
      margin: 0,
      fontWeight: '400'
    },
    main: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 24px'
    },
    nav: {
      background: 'rgba(28, 28, 30, 0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '0.5px solid rgba(255, 255, 255, 0.1)',
      position: 'sticky',
      top: '60px',
      zIndex: 90
    },
    navContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 24px',
      display: 'flex',
      gap: '40px'
    },
    navButton: {
      padding: '16px 4px',
      border: 'none',
      background: 'none',
      fontSize: '16px',
      fontWeight: '400',
      cursor: 'pointer',
      borderBottom: '2px solid transparent',
      transition: 'all 0.3s ease',
      color: 'rgba(255, 255, 255, 0.6)'
    },
    navButtonActive: {
      borderBottomColor: '#007AFF',
      color: '#ffffff'
    },
    card: {
      background: 'rgba(28, 28, 30, 0.6)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '32px',
      border: '0.5px solid rgba(255, 255, 255, 0.1)',
      marginBottom: '24px'
    },
    cardTitle: {
      fontSize: '22px',
      fontWeight: '600',
      color: '#ffffff',
      margin: '0 0 24px 0',
      display: 'flex',
      alignItems: 'center',
      letterSpacing: '-0.01em'
    },
    formContainer: {
      background: 'rgba(28, 28, 30, 0.6)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '40px',
      border: '0.5px solid rgba(255, 255, 255, 0.1)'
    },
    formTitle: {
      fontSize: '32px',
      fontWeight: '600',
      color: '#ffffff',
      margin: '0 0 8px 0',
      display: 'flex',
      alignItems: 'center',
      letterSpacing: '-0.01em'
    },
    formSubtitle: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '18px',
      margin: '0 0 40px 0',
      fontWeight: '400'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
      marginBottom: '24px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    label: {
      fontSize: '16px',
      fontWeight: '500',
      color: '#ffffff',
      marginBottom: '8px'
    },
    input: {
      padding: '16px 20px',
      border: '0.5px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      fontSize: '16px',
      background: 'rgba(58, 58, 60, 0.4)',
      color: '#ffffff',
      outline: 'none',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)'
    },
    textarea: {
      padding: '16px 20px',
      border: '0.5px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      fontSize: '16px',
      background: 'rgba(58, 58, 60, 0.4)',
      color: '#ffffff',
      outline: 'none',
      transition: 'all 0.3s ease',
      resize: 'vertical',
      minHeight: '120px',
      backdropFilter: 'blur(10px)',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    },
    select: {
      padding: '16px 20px',
      border: '0.5px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      fontSize: '16px',
      background: 'rgba(58, 58, 60, 0.4)',
      color: '#ffffff',
      outline: 'none',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      backdropFilter: 'blur(10px)'
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginTop: '16px'
    },
    submitButton: {
      width: '100%',
      background: '#007AFF',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '17px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      marginTop: '32px'
    },
    errorMessage: {
      background: 'rgba(255, 59, 48, 0.1)',
      border: '0.5px solid rgba(255, 59, 48, 0.3)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '24px',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center'
    },
    successMessage: {
      background: 'rgba(52, 199, 89, 0.1)',
      border: '0.5px solid rgba(52, 199, 89, 0.3)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '24px',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center'
    },
    jobsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    jobCard: {
      background: 'rgba(28, 28, 30, 0.6)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '32px',
      border: '0.5px solid rgba(255, 255, 255, 0.1)',
      transition: 'all 0.3s ease'
    },
    noJobsMessage: {
      textAlign: 'center',
      padding: '60px 40px',
      background: 'rgba(28, 28, 30, 0.6)',
      borderRadius: '20px',
      color: 'rgba(255, 255, 255, 0.7)',
      border: '0.5px solid rgba(255, 255, 255, 0.1)'
    },
    uploadArea: {
      border: '2px dashed rgba(255, 255, 255, 0.3)',
      borderRadius: '16px',
      padding: '64px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textAlign: 'center',
      background: 'rgba(58, 58, 60, 0.2)'
    },
    skillTag: {
      padding: '8px 16px',
      background: 'rgba(0, 122, 255, 0.2)',
      color: '#40A9FF',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '500',
      border: '0.5px solid rgba(0, 122, 255, 0.3)',
      backdropFilter: 'blur(10px)'
    },
    matchBadge: {
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      whiteSpace: 'nowrap',
      backdropFilter: 'blur(10px)'
    }
  };

  const LandingPage = () => (
    <div style={styles.landingContainer}>
      <div style={styles.landingContent}>
        <h1 style={styles.landingTitle}>
          AI Resume Parser
        </h1>
        <p style={styles.landingSubtitle}>
          Connect talent with opportunity through intelligent resume analysis
        </p>
        
        <div style={styles.userTypeGrid}>
          <div 
            style={styles.userTypeCard}
            onClick={() => setCurrentView('jobSeeker')}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              e.currentTarget.style.background = 'rgba(28, 28, 30, 0.8)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.background = 'rgba(28, 28, 30, 0.6)';
            }}
          >
            <User size={64} style={styles.userTypeIcon} />
            <h3 style={styles.userTypeTitle}>I'm a Job Seeker</h3>
            <p style={styles.userTypeDescription}>
              Upload your resume and discover matching opportunities with AI-powered analysis
            </p>
          </div>
          
          <div 
            style={styles.userTypeCard}
            onClick={() => setCurrentView('employer')}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              e.currentTarget.style.background = 'rgba(28, 28, 30, 0.8)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.background = 'rgba(28, 28, 30, 0.6)';
            }}
          >
            <Building size={64} style={styles.userTypeIcon} />
            <h3 style={styles.userTypeTitle}>I'm an Employer</h3>
            <p style={styles.userTypeDescription}>
              Post jobs and find the perfect candidates with intelligent resume matching
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const JobSeekerView = () => {
    const TextInputSection = () => {
      const [text, setText] = useState('');

      return (
        <div style={{ padding: '20px 0' }}>
          <div style={styles.formContainer}>
            <h3 style={styles.cardTitle}>
              Paste Your Resume Text
            </h3>
            <textarea
              style={styles.textarea}
              rows="12"
              placeholder="Paste your resume text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div style={{ marginTop: '12px', textAlign: 'right' }}>
              <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
                {text.length} characters {text.length >= 50 ? '✓' : `(minimum 50 required)`}
              </span>
            </div>
            <button
              style={{
                ...styles.submitButton,
                opacity: text.trim().length < 50 ? 0.6 : 1,
                cursor: text.trim().length < 50 ? 'not-allowed' : 'pointer',
                marginTop: '20px'
              }}
              onClick={() => handleTextAnalysis(text)}
              onMouseOver={(e) => {
                if (text.trim().length >= 50) {
                  e.target.style.background = '#0056CC';
                }
              }}
              onMouseOut={(e) => {
                if (text.trim().length >= 50) {
                  e.target.style.background = '#007AFF';
                }
              }}
              disabled={loading || text.trim().length < 50}
            >
              {loading ? 'Analyzing...' : 'Analyze Resume Text'}
            </button>
          </div>
        </div>
      );
    };

    const UploadSection = () => (
      <div style={{ padding: '20px 0' }}>
        <div style={styles.formContainer}>
          <div 
            style={styles.uploadArea}
            onClick={() => fileInputRef.current?.click()}
            onMouseOver={(e) => {
              e.target.style.borderColor = 'rgba(0, 122, 255, 0.6)';
              e.target.style.background = 'rgba(0, 122, 255, 0.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.target.style.background = 'rgba(58, 58, 60, 0.2)';
            }}
          >
            <Upload size={48} style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '22px', fontWeight: '600', color: '#ffffff', margin: '0 0 8px 0' }}>
              Upload Your Resume
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 16px 0', fontSize: '16px' }}>
              Drop your resume here or click to browse
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', margin: 0 }}>
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
            <div style={{ 
              marginTop: '24px', 
              padding: '16px 24px', 
              background: 'rgba(52, 199, 89, 0.1)', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center',
              border: '0.5px solid rgba(52, 199, 89, 0.3)'
            }}>
              <CheckCircle size={20} style={{ color: '#34C759', marginRight: '12px' }} />
              <span style={{ color: '#34C759', fontWeight: '600' }}>Selected: {file.name}</span>
            </div>
          )}
        </div>
      </div>
    );

    return (
      <div>
        <nav style={styles.nav}>
          <div style={styles.navContent}>
            <button
              onClick={() => setActiveTab('jobs')}
              style={{
                ...styles.navButton,
                ...(activeTab === 'jobs' ? styles.navButtonActive : {})
              }}
            >
              💼 Available Jobs ({jobs.length})
            </button>
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
          </div>
        </nav>

        <div style={styles.main}>
          {error && (
            <div style={styles.errorMessage}>
              <XCircle size={20} style={{ marginRight: '12px', color: '#FF3B30' }} />
              <p style={{ color: '#FF3B30', margin: 0, fontSize: '14px' }}>{error}</p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '3px solid rgba(0, 122, 255, 0.2)',
                borderTop: '3px solid #007AFF',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', fontWeight: '500' }}>
                🤖 Analyzing your resume with AI...
              </p>
            </div>
          )}

          {!loading && (
            <>
              {activeTab === 'jobs' && (
                <div style={styles.jobsList}>
                  <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '36px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
                      Available Opportunities
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '18px', margin: 0 }}>
                      {jobs.length} jobs available • Upload your resume to see match percentages
                    </p>
                  </div>

                  {jobs.length === 0 ? (
                    <div style={styles.noJobsMessage}>
                      <Briefcase size={48} style={{ color: 'rgba(255, 255, 255, 0.4)', marginBottom: '16px' }} />
                      <h4 style={{ color: '#ffffff', fontSize: '20px', fontWeight: '600' }}>No jobs available yet</h4>
                      <p>Be the first to check back when employers start posting opportunities!</p>
                    </div>
                  ) : (
                    jobs.map((job) => (
                      <div key={job.job_id} style={styles.jobCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                          <div>
                            <h4 style={{ fontSize: '24px', fontWeight: '600', color: '#ffffff', margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
                              {job.title}
                            </h4>
                            <p style={{ color: 'rgba(255, 255, 255, 0.7)', display: 'flex', alignItems: 'center', margin: 0 }}>
                              <Building size={16} style={{ marginRight: '8px' }} />
                              {job.company}
                            </p>
                          </div>
                          {job.match_percentage && (
                            <div style={{
                              ...styles.matchBadge,
                              background: job.match_percentage >= 90 ? 'rgba(52, 199, 89, 0.2)' : 
                                         job.match_percentage >= 80 ? 'rgba(255, 159, 10, 0.2)' : 
                                         job.match_percentage >= 70 ? 'rgba(255, 69, 58, 0.2)' : 'rgba(142, 142, 147, 0.2)',
                              color: job.match_percentage >= 90 ? '#34C759' : 
                                     job.match_percentage >= 80 ? '#FF9F0A' : 
                                     job.match_percentage >= 70 ? '#FF453A' : '#8E8E93',
                              border: job.match_percentage >= 90 ? '0.5px solid rgba(52, 199, 89, 0.3)' : 
                                     job.match_percentage >= 80 ? '0.5px solid rgba(255, 159, 10, 0.3)' : 
                                     job.match_percentage >= 70 ? '0.5px solid rgba(255, 69, 58, 0.3)' : '0.5px solid rgba(142, 142, 147, 0.3)'
                            }}>
                              <Star size={14} style={{ marginRight: '6px' }} />
                              {job.match_percentage}% Match
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                            <MapPin size={16} style={{ marginRight: '8px' }} />
                            {job.location}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                            <Clock size={16} style={{ marginRight: '8px' }} />
                            {job.experience_required}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', fontWeight: '600', color: '#34C759', fontSize: '14px' }}>
                            <DollarSign size={16} style={{ marginRight: '4px' }} />
                            {job.salary_range}
                          </div>
                          {job.remote && (
                            <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                              <Globe size={16} style={{ marginRight: '8px' }} />
                              Remote Work
                            </div>
                          )}
                        </div>

                        <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6', margin: '0 0 24px 0' }}>
                          {job.description}
                        </p>

                        <div style={{ marginBottom: '24px' }}>
                          <h5 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>
                            Required Skills:
                          </h5>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {job.required_skills?.map((skill, index) => {
                              const isMatched = analysis?.skills?.some(s => 
                                s.toLowerCase().includes(skill.toLowerCase()) ||
                                skill.toLowerCase().includes(s.toLowerCase())
                              );
                              return (
                                <span 
                                  key={index}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    background: isMatched ? 'rgba(52, 199, 89, 0.2)' : 'rgba(142, 142, 147, 0.2)',
                                    color: isMatched ? '#34C759' : 'rgba(255, 255, 255, 0.7)',
                                    border: isMatched ? '0.5px solid rgba(52, 199, 89, 0.3)' : '0.5px solid rgba(142, 142, 147, 0.3)'
                                  }}
                                >
                                  {isMatched && <CheckCircle size={12} style={{ marginRight: '4px' }} />}
                                  {skill}
                                </span>
                              );
                            }) || []}
                          </div>
                        </div>

                        <button 
                          style={styles.submitButton}
                          onMouseOver={(e) => e.target.style.background = '#0056CC'}
                          onMouseOut={(e) => e.target.style.background = '#007AFF'}
                          onClick={() => {
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
              )}
              {activeTab === 'upload' && <UploadSection />}
              {activeTab === 'text' && <TextInputSection />}
              {activeTab === 'analysis' && analysis && <AnalysisSection />}
            </>
          )}
        </div>
      </div>
    );
  };

  const EmployerView = () => (
    <div style={styles.main}>
      {error && (
        <div style={styles.errorMessage}>
          <AlertCircle size={20} style={{ marginRight: '12px', color: '#FF3B30' }} />
          <p style={{ color: '#FF3B30', margin: 0, fontSize: '14px' }}>{error}</p>
        </div>
      )}

      {success && (
        <div style={styles.successMessage}>
          <CheckCircle size={20} style={{ marginRight: '12px', color: '#34C759' }} />
          <p style={{ color: '#34C759', margin: 0, fontSize: '14px' }}>{success}</p>
        </div>
      )}

      <div style={styles.formContainer}>
        <h2 style={styles.formTitle}>
          <Plus size={32} style={{ marginRight: '12px', color: '#007AFF' }} />
          Post a New Job
        </h2>
        <p style={styles.formSubtitle}>
          Fill out the form below to post your job. It will be visible to job seekers immediately.
        </p>

        <form onSubmit={handleEmployerSubmit}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Job Title *</label>
              <input
                style={styles.input}
                type="text"
                value={jobForm.title}
                onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 122, 255, 0.6)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.6)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.4)';
                }}
                placeholder="e.g. Senior Full Stack Developer"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Company Name *</label>
              <input
                style={styles.input}
                type="text"
                value={jobForm.company}
                onChange={(e) => setJobForm({...jobForm, company: e.target.value})}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 122, 255, 0.6)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.6)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.4)';
                }}
                placeholder="e.g. TechCorp Inc."
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Location *</label>
              <input
                style={styles.input}
                type="text"
                value={jobForm.location}
                onChange={(e) => setJobForm({...jobForm, location: e.target.value})}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 122, 255, 0.6)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.6)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.4)';
                }}
                placeholder="e.g. San Francisco, CA"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Job Type</label>
              <select
                style={styles.select}
                value={jobForm.job_type}
                onChange={(e) => setJobForm({...jobForm, job_type: e.target.value})}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 122, 255, 0.6)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.6)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.4)';
                }}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Experience Required (Years)</label>
              <input
                style={styles.input}
                type="number"
                value={jobForm.experience_years}
                onChange={(e) => setJobForm({...jobForm, experience_years: parseInt(e.target.value) || 0})}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 122, 255, 0.6)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.6)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.4)';
                }}
                min="0"
                max="20"
                placeholder="0"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Education Level</label>
              <select
                style={styles.select}
                value={jobForm.education_level}
                onChange={(e) => setJobForm({...jobForm, education_level: e.target.value})}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 122, 255, 0.6)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.6)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.4)';
                }}
              >
                <option value="">Any</option>
                <option value="High School">High School</option>
                <option value="Associate Degree">Associate Degree</option>
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="PhD">PhD</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Minimum Salary (USD)</label>
              <input
                style={styles.input}
                type="number"
                value={jobForm.salary_min}
                onChange={(e) => setJobForm({...jobForm, salary_min: e.target.value})}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 122, 255, 0.6)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.6)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.4)';
                }}
                placeholder="50000"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Maximum Salary (USD)</label>
              <input
                style={styles.input}
                type="number"
                value={jobForm.salary_max}
                onChange={(e) => setJobForm({...jobForm, salary_max: e.target.value})}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 122, 255, 0.6)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.6)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.4)';
                }}
                placeholder="80000"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Job Description *</label>
            <textarea
              style={styles.textarea}
              value={jobForm.description}
              onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(0, 122, 255, 0.6)';
                e.target.style.background = 'rgba(58, 58, 60, 0.6)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(58, 58, 60, 0.4)';
              }}
              placeholder="Describe the role, responsibilities, and what you're looking for in a candidate..."
              required
            />
          </div>

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Required Skills *</label>
              <input
                style={styles.input}
                type="text"
                value={jobForm.required_skills}
                onChange={(e) => setJobForm({...jobForm, required_skills: e.target.value})}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 122, 255, 0.6)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.6)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.4)';
                }}
                placeholder="React, Node.js, JavaScript, Python (comma-separated)"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Preferred Skills</label>
              <input
                style={styles.input}
                type="text"
                value={jobForm.preferred_skills}
                onChange={(e) => setJobForm({...jobForm, preferred_skills: e.target.value})}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 122, 255, 0.6)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.6)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.background = 'rgba(58, 58, 60, 0.4)';
                }}
                placeholder="TypeScript, AWS, Docker (comma-separated)"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Benefits</label>
            <input
              style={styles.input}
              type="text"
              value={jobForm.benefits}
              onChange={(e) => setJobForm({...jobForm, benefits: e.target.value})}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(0, 122, 255, 0.6)';
                e.target.style.background = 'rgba(58, 58, 60, 0.6)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(58, 58, 60, 0.4)';
              }}
              placeholder="Health Insurance, 401k, Remote Work (comma-separated)"
            />
          </div>

          <div style={styles.checkbox}>
            <input
              type="checkbox"
              id="remote"
              checked={jobForm.remote}
              onChange={(e) => setJobForm({...jobForm, remote: e.target.checked})}
              style={{ width: '18px', height: '18px' }}
            />
            <label htmlFor="remote" style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.8)' }}>
              Remote work available
            </label>
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={(e) => !loading && (e.target.style.background = '#0056CC')}
            onMouseOut={(e) => !loading && (e.target.style.background = '#007AFF')}
            disabled={loading}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px'
                }}></div>
                Posting Job...
              </>
            ) : (
              <>
                <Send size={16} style={{ marginRight: '8px' }} />
                Post Job
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  const AnalysisSection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <User size={20} style={{ marginRight: '8px', color: '#007AFF' }} />
          Contact Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.8)', padding: '12px 16px', background: 'rgba(58, 58, 60, 0.3)', borderRadius: '12px' }}>
            <User size={16} style={{ marginRight: '12px', color: '#007AFF' }} />
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2px' }}>Name</div>
              <div style={{ fontWeight: '500' }}>{analysis?.contact?.name || 'Not detected'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.8)', padding: '12px 16px', background: 'rgba(58, 58, 60, 0.3)', borderRadius: '12px' }}>
            <Mail size={16} style={{ marginRight: '12px', color: '#007AFF' }} />
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2px' }}>Email</div>
              <div style={{ fontWeight: '500' }}>{analysis?.contact?.email || 'Not detected'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.8)', padding: '12px 16px', background: 'rgba(58, 58, 60, 0.3)', borderRadius: '12px' }}>
            <Phone size={16} style={{ marginRight: '12px', color: '#007AFF' }} />
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2px' }}>Phone</div>
              <div style={{ fontWeight: '500' }}>{analysis?.contact?.phone || 'Not detected'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.8)', padding: '12px 16px', background: 'rgba(58, 58, 60, 0.3)', borderRadius: '12px' }}>
            <MapPin size={16} style={{ marginRight: '12px', color: '#007AFF' }} />
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2px' }}>Location</div>
              <div style={{ fontWeight: '500' }}>{analysis?.contact?.location || 'Not detected'}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <Award size={20} style={{ marginRight: '8px', color: '#007AFF' }} />
          Resume Quality Score
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '12px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', overflow: 'hidden' }}>
            <div 
              style={{
                height: '100%',
                borderRadius: '6px',
                transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                width: `${analysis?.score || 0}%`,
                background: analysis?.score >= 90 ? 'linear-gradient(90deg, #34C759 0%, #30D158 100%)' : 
                           analysis?.score >= 80 ? 'linear-gradient(90deg, #FF9F0A 0%, #FFCC02 100%)' :
                           analysis?.score >= 60 ? 'linear-gradient(90deg, #FF6B35 0%, #FF8A00 100%)' : 
                           'linear-gradient(90deg, #FF453A 0%, #FF6B6B 100%)'
              }}
            ></div>
          </div>
          <span style={{
            fontSize: '32px',
            fontWeight: '700',
            color: analysis?.score >= 90 ? '#34C759' : 
                   analysis?.score >= 80 ? '#FF9F0A' :
                   analysis?.score >= 60 ? '#FF6B35' : '#FF453A'
          }}>
            {analysis?.score || 0}/100
          </span>
        </div>
        <div style={{ 
          color: 'rgba(255, 255, 255, 0.8)', 
          fontSize: '16px', 
          padding: '16px 20px',
          background: 'rgba(58, 58, 60, 0.3)',
          borderRadius: '12px',
          borderLeft: `4px solid ${analysis?.score >= 90 ? '#34C759' : 
                                  analysis?.score >= 80 ? '#FF9F0A' :
                                  analysis?.score >= 60 ? '#FF6B35' : '#FF453A'}`
        }}>
          {analysis?.score >= 90 && "🎉 Excellent resume! Very well structured and comprehensive."}
          {analysis?.score >= 80 && analysis?.score < 90 && "👍 Great resume! Minor improvements could make it even better."}
          {analysis?.score >= 60 && analysis?.score < 80 && "📝 Good resume! Some areas could be enhanced for better impact."}
          {analysis?.score < 60 && "⚡ Your resume needs improvement. Consider adding more details and structure."}
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <Code size={20} style={{ marginRight: '8px', color: '#007AFF' }} />
          Technical Skills ({analysis?.skills?.length || 0})
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {analysis?.skills?.length > 0 ? (
            analysis.skills.map((skill, index) => (
              <span 
                key={index}
                style={{
                  ...styles.skillTag,
                  background: 'rgba(0, 122, 255, 0.15)',
                  color: '#40A9FF',
                  border: '1px solid rgba(0, 122, 255, 0.3)',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {skill}
              </span>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255, 255, 255, 0.6)', width: '100%' }}>
              <Code size={32} style={{ color: 'rgba(255, 255, 255, 0.4)', marginBottom: '12px' }} />
              <h4 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>No Technical Skills Detected</h4>
              <p style={{ margin: 0 }}>Try including programming languages, frameworks, or tools in your resume.</p>
            </div>
          )}
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <Briefcase size={20} style={{ marginRight: '8px', color: '#007AFF' }} />
          Work Experience
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div style={{ padding: '16px 20px', background: 'rgba(58, 58, 60, 0.3)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', color: '#007AFF', marginBottom: '8px' }}>
              <Clock size={16} style={{ marginRight: '8px' }} />
              <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>Experience</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff' }}>
              {analysis?.experience?.years || 0} years
            </div>
          </div>
          <div style={{ padding: '16px 20px', background: 'rgba(58, 62, 60, 0.3)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', color: '#007AFF', marginBottom: '8px' }}>
              <TrendingUp size={16} style={{ marginRight: '8px' }} />
              <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>Level</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>
              {analysis?.experience?.level || 'Not determined'}
            </div>
          </div>
        </div>
        
        {analysis?.experience?.job_titles?.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>Job Titles:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {analysis.experience.job_titles.map((title, index) => (
                <span key={index} style={{
                  padding: '8px 14px',
                  background: 'rgba(52, 199, 89, 0.15)',
                  color: '#34C759',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '1px solid rgba(52, 199, 89, 0.3)'
                }}>{title}</span>
              ))}
            </div>
          </div>
        )}

        {analysis?.experience?.companies?.length > 0 && (
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: '0 0 12px 0' }}>Companies:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {analysis.experience.companies.map((company, index) => (
                <span key={index} style={{
                  padding: '8px 14px',
                  background: 'rgba(175, 82, 222, 0.15)',
                  color: '#AF52DE',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '1px solid rgba(175, 82, 222, 0.3)'
                }}>{company}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <Award size={20} style={{ marginRight: '8px', color: '#007AFF' }} />
          Education
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {analysis?.education?.highest_degree && (
            <div style={{ padding: '16px 20px', background: 'rgba(58, 58, 60, 0.3)', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Highest Degree</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>{analysis.education.highest_degree}</div>
            </div>
          )}
          {analysis?.education?.field_of_study && (
            <div style={{ padding: '16px 20px', background: 'rgba(58, 58, 60, 0.3)', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Field of Study</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>{analysis.education.field_of_study}</div>
            </div>
          )}
          {analysis?.education?.institution && (
            <div style={{ padding: '16px 20px', background: 'rgba(58, 58, 60, 0.3)', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Institution</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>{analysis.education.institution}</div>
            </div>
          )}
          {analysis?.education?.graduation_year && (
            <div style={{ padding: '16px 20px', background: 'rgba(58, 58, 60, 0.3)', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Graduation</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>{analysis.education.graduation_year}</div>
            </div>
          )}
          
          {!analysis?.education?.highest_degree && 
           !analysis?.education?.field_of_study && 
           !analysis?.education?.institution && (
            <div style={{ 
              gridColumn: '1 / -1',
              textAlign: 'center', 
              padding: '40px 20px', 
              color: 'rgba(255, 255, 255, 0.6)',
              background: 'rgba(58, 58, 60, 0.2)',
              borderRadius: '12px',
              border: '2px dashed rgba(255, 255, 255, 0.2)'
            }}>
              <Award size={32} style={{ color: 'rgba(255, 255, 255, 0.4)', marginBottom: '12px' }} />
              <h4 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>No Education Information</h4>
              <p style={{ margin: 0 }}>Consider adding your educational background to strengthen your profile.</p>
            </div>
          )}
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <FileText size={20} style={{ marginRight: '8px', color: '#007AFF' }} />
          Professional Summary
        </h3>
        <div style={{
          padding: '20px',
          background: 'rgba(58, 58, 60, 0.3)',
          borderRadius: '12px',
          borderLeft: '4px solid #007AFF'
        }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.7', margin: 0, fontSize: '16px' }}>
            {analysis?.professional_summary || analysis?.summary || 'No professional summary detected. Consider adding a summary section to highlight your key qualifications and career objectives.'}
          </p>
        </div>
      </div>
    </div>
  );

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
        
        ::placeholder {
          color: rgba(255, 255, 255, 0.5) !important;
        }
        
        select option {
          background: #1C1C1E !important;
          color: #ffffff !important;
        }
        
        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr !important;
          }
          
          .nav-content {
            flex-wrap: wrap !important;
            gap: 16px !important;
          }
          
          .landing-title {
            font-size: 48px !important;
          }
          
          .user-type-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 
            style={styles.headerTitle}
            onClick={() => {
              setCurrentView('landing');
              setError(null);
              setSuccess(null);
              setAnalysis(null);
              setJobs([]);
            }}
          >
            <Search size={24} style={{ marginRight: '12px', color: '#007AFF' }} />
            AI Resume Parser
          </h1>
          
          {currentView !== 'landing' && (
            <button
              style={styles.backButton}
              onClick={() => {
                setCurrentView('landing');
                setError(null);
                setSuccess(null);
                setAnalysis(null);
                setJobs([]);
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <ChevronLeft size={16} style={{ marginRight: '4px' }} />
              Back to Home
            </button>
          )}
        </div>
      </header>

      {currentView === 'landing' && <LandingPage />}
      {currentView === 'jobSeeker' && <JobSeekerView />}
      {currentView === 'employer' && <EmployerView />}
      
      <div style={{
        textAlign: 'center',
        padding: '20px',
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: '12px'
      }}>
        Backend: {API_BASE_URL} 
        {error && error.includes('connect') && (
          <span style={{ color: '#FF9F0A', marginLeft: '8px' }}>
            ⚠️ Connection Issue
          </span>
        )}
      </div>
    </div>
  );
};

export default ResumeParserApp;
