import { User } from '../models/User.js';
import { NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

class UserService {
  async getUserById(id) {
    try {
      const user = await User.findById(id);
      if (!user) throw new NotFoundError('User');
      return user;
    } catch (error) {
      logger.error(`Get user error: ${error.message}`);
      throw error;
    }
  }

  async getAllUsers(role) {
    try {
      const query = role ? { role } : {};
      const users = await User.find(query).limit(50);
      return users;
    } catch (error) {
      logger.error(`Get all users error: ${error.message}`);
      throw error;
    }
  }

  async updateProfile(id, updates) {
    try {
      const allowedFields = [
        'name', 'bio', 'location', 'avatarUrl',
        'startupName', 'pitchSummary', 'fundingNeeded',
        'fundingCurrency', 'industry', 'foundedYear',
        'teamSize', 'websiteUrl',
        'investmentInterests', 'investmentStages',
        'portfolioCompanies', 'minimumInvestment',
        'maximumInvestment',
      ];

      const filteredUpdates = Object.keys(updates)
        .filter((key) => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {});

      const user = await User.findByIdAndUpdate(id, filteredUpdates, {
        new: true,
        runValidators: true,
      });
      if (!user) throw new NotFoundError('User');
      logger.info(`Profile updated for user: ${id}`);
      return user;
    } catch (error) {
      logger.error(`Update profile error: ${error.message}`);
      throw error;
    }
  }

  async searchUsers(query, role) {
    try {
      const searchQuery = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { startupName: { $regex: query, $options: 'i' } },
        ],
      };
      if (role) searchQuery.role = role;

      const users = await User.find(searchQuery).limit(20);
      return users;
    } catch (error) {
      logger.error(`Search users error: ${error.message}`);
      throw error;
    }
  }
}

export default new UserService();