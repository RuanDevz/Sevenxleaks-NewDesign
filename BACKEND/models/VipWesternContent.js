module.exports = (sequelize, DataTypes) => {
  const VipWesternContent = sequelize.define("VipWesternContent", {
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
      unique: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    //   preview: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    // },
    postDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'VipWesternContents',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['slug']
      },
      {
        fields: ['category']
      },
      {
        fields: ['postDate']
      }
    ]
  });

  return VipWesternContent;
};