module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'stripeAccountVersion', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'v1',
      comment: 'Identifies which Stripe account manages this user subscription (v1=old account, v2=new PJ account)',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'stripeAccountVersion');
  },
};
