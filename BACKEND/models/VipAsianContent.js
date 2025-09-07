module.exports = (sequelize, DataTypes) => {
  const VipAsianContent = sequelize.define("VipAsianContent", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    link: { // Mega
      type: DataTypes.STRING,
      allowNull: false,
    },
      link2:{ // Mega 2
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkP:{ // Pixeldrain
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkG: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkMV1:{ // AdmavenMega
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkMV2:{ // AdmavenMega2
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkMV3:{ // AdmavenPixeldrain
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkMV4:{
      type: DataTypes.STRING,
      allowNull: true,
    },
    slug:{
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    postDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  return VipAsianContent;
};