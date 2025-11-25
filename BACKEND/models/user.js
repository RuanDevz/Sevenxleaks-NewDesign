module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, 
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isVip: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      resetPasswordToken: { 
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordExpires: { 
        type: DataTypes.DATE,
        allowNull: true,
      },
      vipExpirationDate: { 
        type: DataTypes.DATE,
        allowNull: true, 
      },
      profileImage: {
  type: DataTypes.STRING,
  allowNull: true,
},
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      recentlyViewed: { 
        type: DataTypes.ARRAY(DataTypes.STRING), 
        allowNull: true,
        defaultValue: [], 
      },
      stripeSubscriptionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      vipTier: {
        type: DataTypes.ENUM('diamond', 'titanium', 'lifetime'),
        allowNull: true,
        defaultValue: null,
      },
      subscriptionType: {
        type: DataTypes.ENUM('monthly', 'annual', 'lifetime'),
        allowNull: true,
        defaultValue: null,
      },
      requestTickets: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      requestTicketsResetDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isDisabled: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
    }, {
      tableName: 'Users',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['email']
        },
        {
          fields: ['isVip']
        },
        {
          fields: ['isAdmin']
        }
      ]
    });
  
    return User;
  };
  