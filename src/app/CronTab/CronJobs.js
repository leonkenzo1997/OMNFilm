var cron = require('node-cron');
var jobs = require('../Jobs/RunJobs');
const moment = require('moment-timezone');
var processJob = require('../Jobs/ProcessJob');
var billingJobs = require('../Jobs/BillingJobs');
var profitJobs = require('../Jobs/ProfitJobs');
var mediaConvertJob = require('../Jobs/MediaConvertJob');
var HoldAccountJob = require('../Jobs/HoldAccountJob');
const ProgramHandleJob = require('../Jobs/ProgramHandleJob');
const UserHandleJob = require('../Jobs/UserHandleJob');
const RemoveUserJob = require('../Jobs/RemoveForeverAccount');


const CronJobs = {
    constructor() {
        this.cronDisplay();
        this.cronProcess();
        this.cronBilling();
        this.cronDeleteCancel();
        this.cronProfitOne();
        this.cronConvert();
        this.updatePendingProgram();
        this.sendMessagesSchedule();
        this.removeHoldUser();
        this.removeAccount();
    },

    async cronDisplay() {
        cron.schedule('0 15 * * *', async () => {
            try {
                jobs.handle();
                console.log('Display jobs success ! time ' + moment().tz("Asia/Seoul").format("yyyy-MM-DD HH:mm:ss"));
            } catch (error) {
                console.log('Run display error');
            }
        });
    },

    async cronProcess() {
        //* * * * *
        cron.schedule('0 0-23 * * *', async () => {
            try {
                processJob.handle();
                // console.log('Process jobs success ! time ' + moment().tz("Asia/Seoul").format("yyyy-MM-DD HH:mm:ss"));
            } catch (error) {
                console.log('Run process error');
            }
        });
    },

    async cronBilling() {
        cron.schedule('*/10 * * * *', async () => {
        // cron.schedule('* * * * *', async () => {
            try {
                billingJobs.handle();
            } catch (error) {
                console.log('Run task billing error');
            }
        });
    },

    async cronDeleteCancel() {
        cron.schedule('0 0 * * *', async () => {
            try {
                billingJobs.removeDeleteCancel();
            } catch (error) {
                console.log('Cron delete error');
            }
        });
    },

    async cronProfitOne() {
        cron.schedule('2 22 28-31 * *', async () => {
        // cron.schedule('* * * * *', async () => {
            try {
                console.log('Profit job run! time ' + moment().tz("Asia/Seoul").format("yyyy-MM-DD HH:mm:ss"));
                let day = Number(moment().tz("Asia/Seoul").format("DD"));
                if (day == 1) {
                    profitJobs.profitOne();
                }
            } catch (error) {
                console.log('Profit jobs error');
            }
        });
    },

    async cronConvert() {
        cron.schedule('*/4 * * * *', async () => {
        // cron.schedule('* * * * *', async () => {
            try {
                mediaConvertJob.handle();
            } catch (error) {
                console.log('Run task billing error');
            }
        });
    },

    // Run every day at 00h00 update program pending
    async updatePendingProgram() {
        cron.schedule('0 0 * * *', async () => {
            try {
                ProgramHandleJob.updatePendingProgram();
            } catch (error) {
                console.log('Run task update pending program error');
            }
        });
    },

    // Run every minutes send messages schedule
    async sendMessagesSchedule() {
        cron.schedule('* * * * *', async () => {
            try {
                UserHandleJob.sendMessages();

                // Cron job check complete program original
                ProgramHandleJob.checkCompleteOriginal();
            } catch (error) {
                console.log('Run task update pending program error');
            }
        });
    },

    // Run every minutes send messages schedule
    async removeHoldUser() {
        cron.schedule('*/6 * * * *', async () => {
            try {
                HoldAccountJob.handle();
            } catch (error) {
                console.log('Run task hold account error');
            }
        });
    },

    // Run everyday 00:00 KR
    async removeAccount() {
        cron.schedule('00 22 * * *', async () => {
            try {
                RemoveUserJob.handle();
            } catch (error) {
                console.log('Run task deleted account error');
            }
        });
    }
}

module.exports = CronJobs;
