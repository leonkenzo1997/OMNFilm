const BASIC = 7900;
const STANDARD = 9900;
const PREMIUM = 11900;

const RsFormula = {
    formula: (bool, view_rate = {}, rate_tax = {}) => {
        //bool = true is user RS ,false # RS
        let amount = {};
        if (bool) {
            let RS_RATE = rate_tax.rsRate ?? 0.0;
            let TAX = rate_tax.tax ?? 0.0;
            RS_RATE /= 100;
            TAX /= 100;
            let basic =
                BASIC * view_rate.basic * RS_RATE -
                BASIC * view_rate.basic * RS_RATE * TAX;
            let standard =
                STANDARD * view_rate.standard * RS_RATE -
                STANDARD * view_rate.standard * RS_RATE * TAX;
            let premium =
                PREMIUM * view_rate.premium * RS_RATE -
                PREMIUM * view_rate.premium * RS_RATE * TAX;
            let total = basic + standard + premium;
            amount = {
                basic: Number(basic.toFixed(0)),
                standard: Number(standard.toFixed(0)),
                premium: Number(premium.toFixed(0)),
                total: Number(total.toFixed(0)),
            };
        } else {
            let basic = Number((view_rate.basic * 0.4).toFixed(0));
            let standard = Number((view_rate.standard * 0.4).toFixed(0));
            let premium = Number((view_rate.premium * 0.4).toFixed(0));
            let total = basic + standard + premium;
            amount = {
                basic: basic,
                standard: standard,
                premium: premium,
                total: total,
            };
        }
        return amount;
    },
    isEmpty: (data) => {
        for (var key in data) {
            if (data.hasOwnProperty(key)) return false;
        }
        return true;
    },
    getAge(dateString) {
        var today = new Date();
        var birthDate = new Date(dateString);
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    },
    convertTime(dateInt, normal = false) {
        let timeString = '';
        let days = Math.floor(dateInt / 86400);
        if (days > 0) {
            timeString += days + (normal ? 'd ' : 'D ');
            dateInt -= days * 86400;
        }

        let hours = Math.floor(dateInt / 3600) % 24;
        if (hours > 0) {
            hours = hours >= 10 ? hours : '0' + hours;
            timeString += hours + (normal ? 'h ' : 'H ');
            dateInt -= hours * 3600;
        }

        let minutes = Math.floor(dateInt / 60) % 60;
        if (minutes > 0) {
            minutes = minutes >= 10 ? minutes : '0' + minutes;
            timeString += minutes + (normal ? 'm ' : 'M ');
            dateInt -= minutes * 60;
        }

        let seconds = dateInt % 60;
        timeString += seconds + (normal ? 's' : 'S');
        return timeString;
    },
};

module.exports = RsFormula;
