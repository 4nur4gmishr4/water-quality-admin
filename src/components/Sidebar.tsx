import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Droplets, 
  MapPin, 
  Smartphone, 
  AlertTriangle, 
  BarChart3, 
  Settings,
  Users,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Helper functions
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

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const { userProfile } = useAuth();

  const navigationItems = [
    {
      path: '/dashboard',
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      description: 'System overview and statistics',
      permissions: ['view_data']
    },
    {
      path: '/water-quality',
      label: 'Water Quality Monitoring',
      icon: Droplets,
      description: 'Real-time water quality data',
      permissions: ['view_data']
    },
    {
      path: '/disease-hotspots',
      label: 'Disease Hotspots',
      icon: MapPin,
      description: 'Disease risk mapping',
      permissions: ['view_data']
    },
    {
      path: '/device-management',
      label: 'Device Management',
      icon: Activity,
      description: 'IoT device status and control',
      permissions: ['manage_devices']
    },
    {
      path: '/mobile-sync',
      label: 'Mobile App Sync',
      icon: Smartphone,
      description: 'Mobile application data sync',
      permissions: ['view_data']
    },
    {
      path: '/alerts',
      label: 'Alert Management',
      icon: AlertTriangle,
      description: 'System alerts and notifications',
      permissions: ['view_alerts', 'send_alerts']
    },
    {
      path: '/reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      description: 'Data analysis and reports',
      permissions: ['generate_reports', 'view_data']
    },
    {
      path: '/users',
      label: 'User Management',
      icon: Users,
      description: 'Manage system users',
      permissions: ['manage_users']
    },
    {
      path: '/settings',
      label: 'System Settings',
      icon: Settings,
      description: 'System configuration',
      permissions: ['system_config']
    }
  ];

  const hasPermission = (requiredPermissions: string[]) => {
    if (!userProfile?.permissions) return false;
    
    // Super admin has all permissions
    if (userProfile.permissions.includes('all')) return true;
    
    // Check if user has any of the required permissions
    return requiredPermissions.some(permission => 
      userProfile.permissions.includes(permission)
    );
  };

  const getAccessibleItems = () => {
    return navigationItems.filter(item => hasPermission(item.permissions));
  };

  return (
    <>
      <style>
        {`
          .sidebar {
            position: fixed;
            top: 72px;
            bottom: 0;
            width: 280px;
            background: white;
            border-right: 1px solid #dee2e6;
            transition: all 0.3s ease-in-out;
            overflow-y: auto;
            z-index: 1030;
            transform: translateX(-100%);
          }

          .sidebar.open {
            transform: translateX(0);
            box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
          }

          .sidebar-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1020;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease-in-out;
          }

          .sidebar-backdrop.show {
            opacity: 1;
            visibility: visible;
          }

          /* Responsive Layout */
          @media (min-width: 992px) {
            .sidebar {
              transform: translateX(-100%); /* Initially closed on desktop */
              width: 280px;
              top: 72px;
              height: calc(100vh - 72px);
            }

            .sidebar.open {
              transform: translateX(0) !important; /* Open when isOpen is true */
            }

            .sidebar-backdrop {
              display: none;
            }
          }
        `}
      </style>
      {/* Only show backdrop on mobile when sidebar is open */}
      {isOpen && window.innerWidth < 992 && <div className={`sidebar-backdrop ${isOpen ? 'show' : ''}`} onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="p-4">
          <nav>
          <ul className="list-unstyled">
            {getAccessibleItems().map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.path} className="mb-2">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `d-flex align-items-center p-3 text-decoration-none rounded transition-all ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-dark hover:bg-light'
                      }`
                    }
                    style={({ isActive }) => ({
                      transition: 'all 0.2s ease',
                      backgroundColor: isActive ? 'var(--primary-blue)' : 'transparent'
                    })}
                  >
                    <IconComponent size={20} className="mr-3 flex-shrink-0" />
                    <div className="flex-grow-1">
                      <div className="body-small font-weight-bold">
                        {item.label}
                      </div>
                      <div className="caption" style={{ opacity: 0.8 }}>
                        {item.description}
                      </div>
                    </div>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Role Information */}
        <div className="mt-5 p-3 bg-light rounded">
          <h6 className="heading-6 text-primary mb-2">Access Level</h6>
          <div className="d-flex align-items-center mb-2">
            <span className={`badge ${getRoleBadgeColor(userProfile?.role || '')} mr-2`}>
              {getRoleDisplayName(userProfile?.role || '')}
            </span>
          </div>
          <div className="caption text-muted">
            {userProfile?.district && (
              <>District: {userProfile.district}<br /></>
            )}
            State: {userProfile?.state || 'N/A'}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 p-3 bg-light rounded">
          <h6 className="heading-6 text-primary mb-2">Quick Stats</h6>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="caption">Active Devices</span>
            <span className="badge badge-success">24</span>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="caption">Critical Alerts</span>
            <span className="badge badge-danger">3</span>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="caption">Coverage</span>
            <span className="badge badge-info">15 Villages</span>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
