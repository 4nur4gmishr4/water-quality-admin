import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Bell, 
  LogOut, 
  Settings, 
  User, 
  Shield,
  ChevronDown,
  Menu
} from 'lucide-react';

const Header: React.FC<{ onToggleSidebar: () => void }> = ({ onToggleSidebar }) => {
  const { userProfile, logout } = useAuth();
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'badge-danger';
      case 'state_admin':
        return 'badge-warning';
      case 'district_admin':
        return 'badge-primary';
      case 'health_officer':
        return 'badge-success';
      default:
        return 'badge-secondary';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'state_admin':
        return 'State Admin';
      case 'district_admin':
        return 'District Admin';
      case 'health_officer':
        return 'Health Officer';
      default:
        return 'User';
    }
  };

  return (
    <div className="header-wrapper">
      <style>
        {`
          @media (max-width: 576px) {
            .header-title {
              max-width: 200px;
            }
          }
          
          .mobile-menu {
            display: none;
          }
          
          @media (max-width: 576px) {
            .mobile-menu {
              display: block;
            }
          }
        `}
      </style>
      <header className="bg-white border-bottom shadow-sm">
        <div className="container-fluid">
          <div className="d-flex align-items-center justify-content-between py-3">
            {/* Sidebar Toggle Button */}
          <button
            className="btn btn-link p-1 mr-2"
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <Menu size={24} />
          </button>

          {/* Government Logo and Title */}
          <div className="d-flex align-items-center flex-grow-1">
            <div className="d-flex align-items-center mr-4">
              <Shield className="text-primary mr-2" size={28} />
              <div className="header-title">
                <h1 className="heading-5 mb-0 text-primary d-none d-sm-block">
                  Water Quality Monitoring
                </h1>
                <h1 className="heading-5 mb-0 text-primary d-block d-sm-none">
                  WQM
                </h1>
                <small className="text-muted d-none d-md-block">
                  Government of India - Ministry of Development of North Eastern Region
                </small>
              </div>
            </div>
          </div>

          {/* User Info and Actions */}
          <div className="d-flex align-items-center">
            {/* Notifications */}
            <div className="position-relative mr-3 d-none d-sm-block">
              <button className="btn btn-link p-2 position-relative">
                <Bell size={20} className="text-muted" />
                <span className="badge badge-danger position-absolute" 
                      style={{ 
                        top: '5px', 
                        right: '5px', 
                        fontSize: '0.6rem',
                        padding: '0.2rem 0.3rem'
                      }}>
                  3
                </span>
              </button>
            </div>



            {/* User Profile Dropdown */}
            <div className="position-relative">
              <button
                className="btn btn-link d-flex align-items-center p-2 text-decoration-none text-dark"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="d-flex align-items-center">
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mr-2"
                       style={{ width: '32px', height: '32px', fontSize: '0.875rem' }}>
                    {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left mr-2">
                    <div className="body-small font-weight-bold">
                      {userProfile?.full_name || 'User'}
                    </div>
                    <div className="d-flex align-items-center">
                      <span className={`badge ${getRoleBadgeColor(userProfile?.role || '')} mr-1`}>
                        {getRoleDisplayName(userProfile?.role || '')}
                      </span>
                      {userProfile?.state && (
                        <small className="text-muted">
                          {userProfile.district ? `${userProfile.district}, ` : ''}{userProfile.state}
                        </small>
                      )}
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-muted" />
                </div>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="position-absolute bg-white border rounded shadow-lg"
                     style={{ 
                       right: '0', 
                       top: '100%', 
                       minWidth: '200px',
                       zIndex: 1000
                     }}>
                  <div className="p-3 border-bottom">
                    <div className="body-small font-weight-bold">
                      {userProfile?.full_name}
                    </div>
                    <div className="caption text-muted">
                      {userProfile?.email}
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <button className="btn btn-link w-100 text-left d-flex align-items-center py-2 px-3">
                      <User size={16} className="mr-2" />
                      Profile
                    </button>
                    <button className="btn btn-link w-100 text-left d-flex align-items-center py-2 px-3">
                      <Settings size={16} className="mr-2" />
                      Settings
                    </button>
                  </div>
                  
                  <div className="border-top py-2">
                    <button 
                      className="btn btn-link w-100 text-left d-flex align-items-center py-2 px-3 text-danger"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {/* Mobile Menu */}
      <div className={`mobile-menu position-fixed bg-white w-100 ${isMobileMenuOpen ? 'show' : ''}`}
           style={{
             top: '72px',
             left: 0,
             right: 0,
             bottom: 0,
             zIndex: 1000,
             transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
             transition: 'transform 0.3s ease-in-out'
           }}>
        <div className="border-top">
          <div className="p-3">
            <div className="d-flex align-items-center mb-3">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mr-2"
                   style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="font-weight-bold">{userProfile?.full_name || 'User'}</div>
                <span className={`badge ${getRoleBadgeColor(userProfile?.role || '')}`}>
                  {getRoleDisplayName(userProfile?.role || '')}
                </span>
              </div>
            </div>
            <div className="mb-2 text-muted small">
              {userProfile?.state && (
                <>{userProfile.district ? `${userProfile.district}, ` : ''}{userProfile.state}</>
              )}
            </div>
          </div>
          
          <div className="border-top">
            <button className="btn btn-link w-100 text-left d-flex align-items-center py-3 px-3">
              <Bell size={20} className="mr-3" />
              Notifications
              <span className="badge badge-danger ml-auto">3</span>
            </button>
            <button className="btn btn-link w-100 text-left d-flex align-items-center py-3 px-3">
              <User size={20} className="mr-3" />
              Profile
            </button>
            <button className="btn btn-link w-100 text-left d-flex align-items-center py-3 px-3">
              <Settings size={20} className="mr-3" />
              Settings
            </button>
            <button 
              className="btn btn-link w-100 text-left d-flex align-items-center py-3 px-3 text-danger"
              onClick={handleLogout}
            >
              <LogOut size={20} className="mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop for dropdowns */}
      {(showDropdown || isMobileMenuOpen) && (
        <div 
          className="position-fixed w-100 h-100"
          style={{ top: 0, left: 0, zIndex: 999 }}
          onClick={() => {
            setShowDropdown(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}
    </header>
  </div>
  );
};

export default Header;
