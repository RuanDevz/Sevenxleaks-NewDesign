module.exports = (sequelize, DataTypes) => {
  const LinkvertiseConfig = sequelize.define('LinkvertiseConfig', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      defaultValue: 1
    },
    activeAccount: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: process.env.ID_LINKVERTISE_PRIMARY || process.env.ID_LINKVERTISE_SECONDARY,
      comment: 'ID da conta ativa do Linkvertise'
    }
  }, {
    tableName: 'LinkvertiseConfigs',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['id']
      }
    ]
  });

  return LinkvertiseConfig;
};