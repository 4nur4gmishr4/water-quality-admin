import React, { useState } from 'react';
import { 
  Users, 
  UserPlus,
  Search, 
  Edit2, 
  Trash2
} from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  state?: string;
  district?: string;
  status: 'active' | 'inactive';
  last_login?: string;
}

const UserManagement: React.FC = () => {
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  const users: User[] = [
    {
      id: '1',
      full_name: 'Rajesh Kumar',
      email: 'rajesh.kumar@gov.in',
      role: 'state_admin',
      state: 'Assam',
      district: undefined,
      status: 'active',
      last_login: '2023-09-13T10:30:00'
    },
    {
      id: '2',
      full_name: 'Priya Singh',
      email: 'priya.singh@gov.in',
      role: 'district_admin',
      state: 'Meghalaya',
      district: 'East Khasi Hills',
      status: 'active',
      last_login: '2023-09-12T15:45:00'
    }
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'badge-danger';
      case 'state_admin': return 'badge-warning';
      case 'district_admin': return 'badge-primary';
      case 'health_officer': return 'badge-success';
      default: return 'badge-secondary';
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center">
            <div className="d-flex align-items-center mb-3 mb-sm-0">
              <Users className="text-primary mr-3" size={32} />
              <div>
                <h1 className="heading-2 mb-0">User Management</h1>
                <p className="text-muted mb-0">Manage system users and permissions</p>
              </div>
            </div>
            <button 
              className="btn btn-primary d-flex align-items-center" 
              onClick={() => setShowAddUserForm(true)}
            >
              <UserPlus size={18} className="mr-2" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="form-responsive">
                <div className="form-row align-items-end">
                  <div className="form-col">
                    <div className="form-group mb-0">
                      <label className="caption text-muted">Search Users</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search by name, email, or location"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="input-group-append">
                          <button className="btn btn-outline-secondary">
                            <Search size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="form-col">
                    <div className="form-group mb-0">
                      <label className="caption text-muted">Filter by Role</label>
                      <select className="form-control">
                        <option value="">All Roles</option>
                        <option value="state_admin">State Admin</option>
                        <option value="district_admin">District Admin</option>
                        <option value="health_officer">Health Officer</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-col">
                    <div className="form-group mb-0">
                      <label className="caption text-muted">Filter by State</label>
                      <select className="form-control">
                        <option value="">All States</option>
                        <option value="assam">Assam</option>
                        <option value="meghalaya">Meghalaya</option>
                        <option value="manipur">Manipur</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive-custom">
                <table className="table table-stack-mobile mb-0">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td data-label="User">
                          <div className="d-flex align-items-center">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mr-2"
                                 style={{ width: '32px', height: '32px', fontSize: '0.875rem' }}>
                              {user.full_name.charAt(0)}
                            </div>
                            <div className="text-left">
                              <div className="font-weight-bold">{user.full_name}</div>
                              <small className="text-muted">{user.email}</small>
                            </div>
                          </div>
                        </td>
                        <td data-label="Role">
                          <span className={`badge ${getRoleBadgeColor(user.role)}`}>
                            {user.role.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </span>
                        </td>
                        <td data-label="Location">
                          {user.district ? (
                            <div>
                              <div className="font-weight-bold">{user.district}</div>
                              <small className="text-muted">{user.state}</small>
                            </div>
                          ) : (
                            <div>{user.state}</div>
                          )}
                        </td>
                        <td data-label="Status">
                          <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td data-label="Last Login">
                          <small className="text-muted">
                            {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                          </small>
                        </td>
                        <td data-label="Actions">
                          <div className="btn-group">
                            <button className="btn btn-sm btn-outline-primary">
                              <Edit2 size={16} />
                            </button>
                            <button className="btn btn-sm btn-outline-danger">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Action Menu */}
              <div className="d-block d-md-none p-3 border-top">
                <select className="form-control">
                  <option value="">Bulk Actions</option>
                  <option value="activate">Activate Selected</option>
                  <option value="deactivate">Deactivate Selected</option>
                  <option value="delete">Delete Selected</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0">
              <div className="modal-header">
                <h5 className="modal-title">Add New User</h5>
                <button type="button" className="close" onClick={() => setShowAddUserForm(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form className="form-responsive">
                  <div className="form-row">
                    <div className="form-col">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" className="form-control" placeholder="Enter full name" />
                      </div>
                    </div>
                    <div className="form-col">
                      <div className="form-group">
                        <label>Email</label>
                        <input type="email" className="form-control" placeholder="Enter email" />
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-col">
                      <div className="form-group">
                        <label>Role</label>
                        <select className="form-control">
                          <option value="">Select Role</option>
                          <option value="state_admin">State Admin</option>
                          <option value="district_admin">District Admin</option>
                          <option value="health_officer">Health Officer</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-col">
                      <div className="form-group">
                        <label>State</label>
                        <select className="form-control">
                          <option value="">Select State</option>
                          <option value="assam">Assam</option>
                          <option value="meghalaya">Meghalaya</option>
                          <option value="manipur">Manipur</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-col">
                      <div className="form-group">
                        <label>District</label>
                        <select className="form-control">
                          <option value="">Select District</option>
                          <option value="east_khasi_hills">East Khasi Hills</option>
                          <option value="west_khasi_hills">West Khasi Hills</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-col">
                      <div className="form-group">
                        <label>Status</label>
                        <select className="form-control">
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-link" onClick={() => setShowAddUserForm(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary d-flex align-items-center">
                  <UserPlus size={18} className="mr-2" />
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
