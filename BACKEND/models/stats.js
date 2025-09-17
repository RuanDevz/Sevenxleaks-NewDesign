// models/stats.js

module.exports = (sequelize, DataTypes) => {
  const Stats = sequelize.define("Stats", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    totalUsers: {
      type: DataTypes.INTEGER,
      defaultValue: 0, 
    },
    totalVIPs: {
      type: DataTypes.INTEGER,
      defaultValue: 0, 
    },
    totalContentRecommendations: {
      type: DataTypes.INTEGER,
      defaultValue: 0, 
    },
  }, {
    tableName: 'Stats',
    timestamps: true
  });

  return Stats;
};
