module.exports = (sequelize, DataTypes) => {
  const ContentRequest = sequelize.define('ContentRequest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    requestNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    vipTier: {
      type: DataTypes.ENUM('diamond', 'titanium'),
      allowNull: false,
    },
    creatorName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    profileLink: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contentType: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    additionalDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    completedLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'ContentRequests',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['requestNumber']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['vipTier']
      }
    ]
  });

  ContentRequest.associate = (models) => {
    ContentRequest.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return ContentRequest;
};
