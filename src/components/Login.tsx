import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login } = useAuth();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      // Error handling is done in the AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light d-flex align-items-center justify-content-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div className="card shadow-lg">
              <div className="card-body p-5">
                {/* Government Header */}
                <div className="text-center mb-5">
                  <div className="d-flex justify-content-center align-items-center mb-3">
                    <Shield className="text-primary mr-3" size={32} />
                    <h1 className="heading-3 m-0">Government of India</h1>
                  </div>
                  <h2 className="heading-4 text-primary mb-2">
                    Water Quality Monitoring System
                  </h2>
                  <p className="text-muted mb-0">
                    Ministry of Development of North Eastern Region
                  </p>
                  <div className="bg-warning text-dark p-2 mt-3 rounded">
                    <small className="font-weight-bold">
                      🔒 ADMIN ACCESS ONLY
                    </small>
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label required">
                      Official Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="your.name@gov.in"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) {
                          setErrors({ ...errors, email: undefined });
                        }
                      }}
                      disabled={loading}
                      autoComplete="email"
                    />
                    {errors.email && (
                      <div className="form-error">{errors.email}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="password" className="form-label required">
                      Password
                    </label>
                    <div className="position-relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        className={`form-control pr-5 ${errors.password ? 'is-invalid' : ''}`}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) {
                            setErrors({ ...errors, password: undefined });
                          }
                        }}
                        disabled={loading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="btn btn-link position-absolute"
                        style={{ 
                          right: '10px', 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          border: 'none',
                          background: 'none',
                          padding: '0',
                          color: 'var(--text-muted)'
                        }}
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <div className="form-error">{errors.password}</div>
                    )}
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="rememberMe"
                        disabled={loading}
                      />
                      <label className="form-check-label body-small" htmlFor="rememberMe">
                        Remember me
                      </label>
                    </div>
                    <a
                      href="#forgot-password"
                      className="body-small text-primary text-decoration-none"
                      onClick={(e) => {
                        e.preventDefault();
                        // TODO: Implement forgot password
                        alert('Please contact your system administrator for password reset.');
                      }}
                    >
                      Forgot password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="loading-spinner mr-2"></span>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2" size={16} />
                        Sign In
                      </>
                    )}
                  </button>
                </form>

                {/* Demo Notice */}
                <div className="alert alert-success mt-4 mb-0">
                  <div className="d-flex align-items-start">
                    <Shield className="text-success mt-1 mr-2 flex-shrink-0" size={16} />
                    <div>
                      <h6 className="alert-heading mb-1">Demo Environment</h6>
                      <p className="mb-0 body-small">
                        This is a demonstration of the Water Quality Monitoring System. 
                        Use the demo credentials below to explore all features.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Demo Credentials */}
                <div className="alert alert-info mt-3 mb-0">
                  <h6 className="alert-heading mb-2">🚀 Demo Access - No Setup Required!</h6>
                  <div className="body-small">
                    <strong>Super Admin:</strong> admin@waterquality.gov.in / admin123
                    <br />
                    <strong>Quick Demo:</strong> demo / demo
                    <br />
                    <em className="text-muted">Use these credentials to explore the dashboard features</em>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="card-footer text-center bg-light">
                <small className="text-muted">
                  © 2025 Government of India. All rights reserved.
                  <br />
                  Ministry of Development of North Eastern Region
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
