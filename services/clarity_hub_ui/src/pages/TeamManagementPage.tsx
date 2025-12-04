import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Trash2, 
  Crown,
  Eye,
  MoreVertical,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Viewer' | 'Analyst';
  status: 'active' | 'pending' | 'suspended';
  invitedAt: Date;
  lastActive?: Date;
  invitedBy: string;
}

interface InviteFormData {
  email: string;
  name: string;
  role: 'Admin' | 'Viewer' | 'Analyst';
}

export const TeamManagementPage = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [inviteForm, setInviteForm] = useState<InviteFormData>({
    email: '',
    name: '',
    role: 'Viewer'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Load team members
  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      // Real API call - endpoint needs to be implemented
      const response = await fetch('/api/team/members', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      
      const data = await response.json();
      setTeamMembers(data);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      setTeamMembers([]);
    }
  };

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.name) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const newMember: TeamMember = {
        id: Date.now().toString(),
        email: inviteForm.email,
        name: inviteForm.name,
        role: inviteForm.role,
        status: 'pending',
        invitedAt: new Date(),
        invitedBy: 'Admin User'
      };

      setTeamMembers([...teamMembers, newMember]);
      setShowInviteModal(false);
      setInviteForm({ email: '', name: '', role: 'Viewer' });
    } catch (error) {
      console.error('Failed to invite user:', error);
      alert('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      setTeamMembers(teamMembers.filter(m => m.id !== selectedMember.id));
      setShowDeleteModal(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Failed to delete member:', error);
      alert('Failed to remove team member');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'Admin' | 'Viewer' | 'Analyst') => {
    try {
      // TODO: Replace with actual API call
      setTeamMembers(teamMembers.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      ));
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleResendInvite = async (_memberId: string) => {
    try {
      // TODO: Replace with actual API call
      alert('Invitation resent successfully');
    } catch (error) {
      console.error('Failed to resend invite:', error);
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'Analyst': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'Viewer': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      case 'suspended': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'suspended': return <XCircle size={14} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />

      <main className="ml-64 p-8">
        {/* Page Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 gradient-gold rounded-2xl flex items-center justify-center shadow-xl">
                <Users size={32} style={{ color: 'hsl(var(--background))' }} />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gradient-gold mb-2">
                  Team Management
                </h1>
                <p className="text-muted-foreground flex items-center">
                  <Users className="h-4 w-4 mr-2" style={{ color: 'hsl(var(--primary-gold))' }} />
                  Manage team members and access controls
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-smooth shadow-glow hover:shadow-glow-lg"
              style={{
                backgroundColor: 'hsl(var(--primary-gold))',
                color: 'hsl(var(--background))'
              }}
            >
              <UserPlus size={20} />
              Invite Team Member
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" 
                   style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.2)' }}>
                <Users size={24} style={{ color: 'hsl(var(--primary-gold))' }} />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {teamMembers.filter(m => m.status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">Active Members</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-yellow-500/20">
                <Clock size={24} className="text-yellow-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {teamMembers.filter(m => m.status === 'pending').length}
            </div>
            <div className="text-sm text-muted-foreground">Pending Invites</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-red-500/20">
                <Crown size={24} className="text-red-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {teamMembers.filter(m => m.role === 'Admin').length}
            </div>
            <div className="text-sm text-muted-foreground">Administrators</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-500/20">
                <Eye size={24} className="text-blue-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {teamMembers.filter(m => m.role === 'Viewer').length}
            </div>
            <div className="text-sm text-muted-foreground">Viewers</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary-gold"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-muted-foreground" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-primary-gold"
              >
                <option value="all">All Roles</option>
                <option value="Admin">Admins</option>
                <option value="Analyst">Analysts</option>
                <option value="Viewer">Viewers</option>
              </select>
            </div>
          </div>
        </div>

        {/* Team Members Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-card-hover border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Member</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Invited</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Last Active</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-card-hover transition-smooth">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center font-bold text-background">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            {member.name}
                            {member.role === 'Admin' && (
                              <Crown size={14} className="text-primary-gold" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as any)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.role)} focus:outline-none`}
                        disabled={member.id === '1'} // Can't change own role
                      >
                        <option value="Admin">Admin</option>
                        <option value="Analyst">Analyst</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                        {getStatusIcon(member.status)}
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {member.invitedAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {member.lastActive ? member.lastActive.toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                        className="p-2 hover:bg-white/5 rounded-lg text-foreground inline-flex"
                        disabled={member.id === '1'} // Can't modify own account
                      >
                        <MoreVertical size={18} />
                      </button>
                      {openMenuId === member.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-surface z-10">
                          {member.status === 'pending' && (
                            <button
                              onClick={() => handleResendInvite(member.id)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-card-hover flex items-center gap-2 text-foreground"
                            >
                              <Mail size={16} />
                              Resend Invite
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setShowDeleteModal(true);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-card-hover flex items-center gap-2 text-red-400"
                          >
                            <Trash2 size={16} />
                            Remove Member
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMembers.length === 0 && (
            <div className="p-12 text-center">
              <Users size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No team members found</p>
            </div>
          )}
        </div>
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 shadow-surface">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <UserPlus size={24} className="text-primary-gold" />
                Invite Team Member
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-foreground font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary-gold"
                />
              </div>

              <div>
                <label className="block text-foreground font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="john@company.com"
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary-gold"
                />
              </div>

              <div>
                <label className="block text-foreground font-medium mb-2">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-primary-gold"
                >
                  <option value="Viewer">Viewer - Read-only access</option>
                  <option value="Analyst">Analyst - Can manage alerts and scans</option>
                  <option value="Admin">Admin - Full system access</option>
                </select>
                <p className="text-sm text-muted-foreground mt-2">
                  {inviteForm.role === 'Viewer' && 'Can view dashboards and reports only'}
                  {inviteForm.role === 'Analyst' && 'Can acknowledge alerts, run scans, and generate reports'}
                  {inviteForm.role === 'Admin' && 'Full access including team management and settings'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-white/5 transition-smooth"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg font-semibold transition-smooth disabled:opacity-50"
                style={{
                  backgroundColor: 'hsl(var(--primary-gold))',
                  color: 'hsl(var(--background))'
                }}
              >
                {loading ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedMember(null);
        }}
        onConfirm={handleDeleteMember}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${selectedMember?.name}? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
        loading={loading}
      />
    </div>
  );
};
