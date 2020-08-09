import Auth from '/imports/ui/services/auth';

const logoutRouteHandler = () => {
  Auth.logout()
    .then(() => {
      window.location.href = 'https://enlite.in';
    });
};

export default logoutRouteHandler;
