const admin = {
    notFound: function (id) {
        return 'Not found id: ' + id + ' in admin!!!';
    },
    msgDeleteAdmin: function (id) {
        return 'Deleted successfully _id: ' + id + ' in admin!!!';
    },
    msgUpdateAdmin: function (id) {
        return 'Updated successfully _id ' + id + ' in admin!!!';
    },
};
module.exports = admin;
