import { useState, useEffect } from "react";
import { useAuth } from "../App";
import { useToast } from "../components/Toast";
import { getCurrentUser, updateProfile, changePassword, fetchSubmissions, fetchParticipations } from "../api/api";

export default function Profile() {
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ contestsJoined: 0, totalSubmissions: 0, totalScore: 0 });
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([getCurrentUser(), fetchParticipations({ user_id: user.user_id }), fetchSubmissions({ user_id: user.user_id })])
      .then(([profileData, participations, submissions]) => {
        setProfile(profileData); setNewUsername(profileData.username); setNewEmail(profileData.email);
        const totalScore = submissions.reduce((sum: number, s: any) => sum + (s.score || 0), 0);
        setStats({ contestsJoined: participations.length, totalSubmissions: submissions.length, totalScore });
      }).catch(() => showToast("Failed to load profile", "error")).finally(() => setLoading(false));
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingProfile(true);
    try {
      await updateProfile({ username: newUsername, email: newEmail });
      const token = localStorage.getItem("token") || "";
      login({ ...user!, username: newUsername, email: newEmail }, token);
      showToast("Profile updated!", "success"); setEditingProfile(false);
    } catch (err: any) { showToast(err.message, "error"); } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { showToast("Passwords do not match", "error"); return; }
    if (newPwd.length < 6) { showToast("Password must be at least 6 characters", "error"); return; }
    setSavingPwd(true);
    try {
      await changePassword(currentPwd, newPwd);
      showToast("Password changed!", "success"); setShowPasswordForm(false); setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (err: any) { showToast(err.message, "error"); } finally { setSavingPwd(false); }
  };

  if (loading) return <div className="skeleton-block" />;
  if (!profile) return <p>Failed to load profile.</p>;

  return (
    <div className="profile-page">
      <h1>👤 My Profile</h1>
      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-avatar-large">{profile.username.charAt(0).toUpperCase()}</div>
          <h2>{profile.username}</h2>
          <p className="profile-email">{profile.email}</p>
          <span className={`role-badge ${profile.role === "ADMIN" ? "role-admin" : "role-user"}`}>{profile.role}</span>
          <p className="profile-joined">Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
          <div className="profile-actions">
            <button className="btn-small btn-outline" onClick={() => setEditingProfile(!editingProfile)}>✏️ Edit Profile</button>
            <button className="btn-small btn-outline" onClick={() => setShowPasswordForm(!showPasswordForm)}>🔑 Change Password</button>
          </div>
        </div>
        <div className="profile-stats-card">
          <h3>📊 Your Statistics</h3>
          <div className="profile-stats-grid">
            <div className="profile-stat"><span className="profile-stat-value">{stats.contestsJoined}</span><span className="profile-stat-label">Contests Joined</span></div>
            <div className="profile-stat"><span className="profile-stat-value">{stats.totalSubmissions}</span><span className="profile-stat-label">Submissions</span></div>
            <div className="profile-stat"><span className="profile-stat-value green">{stats.totalScore}</span><span className="profile-stat-label">Total Score</span></div>
          </div>
        </div>
      </div>
      {editingProfile && (
        <div className="profile-form-section"><h3>✏️ Edit Profile</h3>
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-group"><label>Username</label><input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required /></div>
            <div className="form-group"><label>Email</label><input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required /></div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditingProfile(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={savingProfile}>{savingProfile ? "Saving..." : "Save Changes"}</button>
            </div>
          </form>
        </div>
      )}
      {showPasswordForm && (
        <div className="profile-form-section"><h3>🔑 Change Password</h3>
          <form onSubmit={handleChangePassword} className="profile-form">
            <div className="form-group"><label>Current Password</label><input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} required /></div>
            <div className="form-group"><label>New Password</label><input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required /></div>
            <div className="form-group"><label>Confirm New Password</label><input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required /></div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowPasswordForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={savingPwd}>{savingPwd ? "Changing..." : "Change Password"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
