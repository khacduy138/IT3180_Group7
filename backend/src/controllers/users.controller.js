const { User, Role } = require('../models');

const listUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'is_active', 'created_at'],
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng' });
  }
};

module.exports = {
  listUsers
};