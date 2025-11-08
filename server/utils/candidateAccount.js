import Role from '../models/Role.js';
import User from '../models/User.js';

const formatCandidatePassword = (application) => {
  const raw = (application?.applicant_name || application?.email || 'candidate').trim();
  const firstName = raw.split(/\s+/)[0] || 'candidate';
  return `${firstName.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'candidate'}@PKLTD`;
};

export const ensureCandidateAccount = async (application) => {
  if (!application?.email) {
    return { user: null, password: null };
  }

  let user = null;
  if (application.offer?.user) {
    user = await User.findById(application.offer.user);
  }
  if (!user) {
    user = await User.findOne({ email: application.email });
  }

  const candidateRole =
    (await Role.findOne({ name: 'Candidate' })) ||
    (await Role.findOne({ name: 'Viewer' })) ||
    (await Role.findOne({}));
  const roleId = candidateRole?._id || user?.roleId;
  const roleName = candidateRole?.name || user?.role || 'Candidate';

  const generatedPassword = formatCandidatePassword(application);

  if (!user) {
    user = new User({
      name: application.applicant_name,
      email: application.email,
      password: generatedPassword,
      role: roleName,
      roleId,
      status: 'active',
    });
  } else {
    user.role = roleName;
    if (roleId) user.roleId = roleId;
    user.password = generatedPassword;
  }

  await user.save();

  application.offer = application.offer || {};
  application.offer.user = user._id;

  return { user, password: generatedPassword };
};

export default ensureCandidateAccount;
