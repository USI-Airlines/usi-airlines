/* profile.js — Profile Page Logic */

let profileData = null;
let isEditing = false;

document.addEventListener('DOMContentLoaded', async () => {
  await requireAuth();
  renderNavbar('profile.html');
  await loadProfile();
  await loadBookingStats();
  initEditForm();
  hideLoader();
});

async function loadProfile() {
  try {
    profileData = await AuthAPI.getProfile();
    const user = profileData.user || profileData;
    renderProfileData(user);
  } catch (err) {
    // Fallback to sessionStorage data
    const user = getCurrentUser();
    renderProfileData(user);
    showToast('Could not fetch latest profile from server.', 'warning');
  }
}

function renderProfileData(user) {
  const initials = getInitials(user.name);
  document.getElementById('sidebar-avatar').textContent = initials;
  document.getElementById('sidebar-name').textContent = user.name || '—';
  document.getElementById('sidebar-email').textContent = user.email || '—';

  document.getElementById('display-name').textContent = user.name || '—';
  document.getElementById('display-email').textContent = user.email || '—';

  const since = user.created_at ? formatDate(user.created_at) : '—';
  document.getElementById('display-since').textContent = since;

  // Pre-fill edit form
  if (document.getElementById('edit-name')) document.getElementById('edit-name').value = user.name || '';
  if (document.getElementById('edit-email')) document.getElementById('edit-email').value = user.email || '';
}

async function loadBookingStats() {
  const user = getCurrentUser();
  try {
    const bookings = await BookingsAPI.getByUser(user.id);
    if (!Array.isArray(bookings)) return;

    const total = bookings.length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    document.getElementById('stat-bookings').textContent = total;
    document.getElementById('stat-confirmed').textContent = confirmed;

    // Days as member
    const profile = profileData?.user || profileData || {};
    if (profile.created_at) {
      const days = Math.floor((Date.now() - new Date(profile.created_at)) / 86400000);
      document.getElementById('stat-member').textContent = days;
    }
  } catch (_) {
    // Stats fail silently
  }
}

/* ── Edit Toggle ── */
function toggleEdit() {
  isEditing = !isEditing;
  document.getElementById('info-display').classList.toggle('hidden', isEditing);
  document.getElementById('edit-form').classList.toggle('visible', isEditing);
  document.getElementById('edit-btn').textContent = isEditing ? 'Cancel' : 'Edit Profile';
}

/* ── Edit Form ── */
function initEditForm() {
  document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('edit-name').value.trim();
    if (!name) { showToast('Name cannot be empty.', 'warning'); return; }

    const btn = document.getElementById('save-btn');
    btn.classList.add('btn-loading'); btn.disabled = true;

    try {
      const result = await AuthAPI.updateProfile({ name });
      const updatedUser = result.user || { ...(profileData?.user || profileData), name };

      // Update sessionStorage
      sessionStorage.setItem('userName', name);

      // Re-render display
      renderProfileData(updatedUser);
      toggleEdit();
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Could not update profile.', 'error');
    } finally {
      btn.classList.remove('btn-loading'); btn.disabled = false;
    }
  });
}
