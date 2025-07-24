const userModel = require('../../Models/User/UserModel');
const memberShipModel = require('../../Models/Manage/Membership/MembershipModel');
const moment = require('moment-timezone');
const jwt = require('jsonwebtoken');
const keyToken = process.env.KEY_GENERATE_TOKEN;
const programModel = require('../../Models/Program/ProgramModel');
const constants = require('../../Constant/constants');
const userProgramModel = require('../../Models/User/UserProgramModel');
const abusingModel = require('../../Models/User/AbusingModel');
const rsService = require('../../Service/RsUser/RsFormula');
const H15 = 54000;// 15 hour

class SocketController {
    async playVideo(socket) {
        try {
            if (socket.userData) {
                const decoded = jwt.verify(socket.userData.token, keyToken);
                const user = await userModel.findOne({ _id: decoded._id });
                let memberShip = await memberShipModel.findOne({ _id: user.userMembership });
                let userProgram = await userProgramModel.findOne({ userID: user._id });

                let data = socket.userData;
                if (!userProgram) {
                    userProgram = await userProgramModel({ userID: user._id ,
                        programIDs: [{
                            "id": data.id,
                            "time": 0
                        }]
                    }).save();
                }
                let lastProgram = [];
                // console.log('check start --------------------------------');
                // console.log(data);
                if (userProgram) {
                    lastProgram = userProgram.lastProgram;
                }
                if (memberShip.packageName === constants.MEMBER_SHIP.STANDARD || memberShip.packageName === constants.MEMBER_SHIP.BASIC) {
                    if (data.check) {
                        if (user.videoPlaying) {
                            if (!user.videoPlaying.includes(data.id)) {
                                socket.emit('play', {
                                    play: true,
                                    data: user.videoPlaying,
                                    lastVideo : lastProgram
                                });
                                this.startTimePlay(data, user, userProgram);
                            } else {
                                socket.emit('play', {
                                    play: false,
                                    data: user.videoPlaying
                                });
                            }
                        } else {
                            user.videoPlaying = [data.id];
                            socket.emit('play', {
                                play: true,
                                data: user.videoPlaying,
                                lastVideo : lastProgram
                            });
                        }
                    } else {
                        if (user.videoPlaying) {
                            if (!user.videoPlaying.includes(data.id)) {
                                user.videoPlaying.push(data.id);
                                socket.emit('play', {
                                    play: true,
                                    data: user.videoPlaying,
                                    lastVideo : lastProgram
                                });
                                user.hasService = Date.now();
                                this.startTimePlay(data, user, userProgram);
                            } else {
                                socket.emit('play', {
                                    play: false,
                                    data: user.videoPlaying
                                });
                            }
                        } else {
                            user.videoPlaying = [data.id];
                            socket.emit('play', {
                                play: true,
                                data: user.videoPlaying,
                                lastVideo : lastProgram
                            });
                        }
                    }
                } else if (memberShip.packageName === constants.MEMBER_SHIP.PREMIUM) {
                    if (data.check) {
                        if (user.videoPlaying) {
                            if (!user.videoPlaying.includes(data.id)) {
                                socket.emit('play', {
                                    play: true,
                                    data: user.videoPlaying,
                                    lastVideo : lastProgram
                                });
                                this.startTimePlay(data, user, userProgram);
                            } else {
                                socket.emit('play', {
                                    play: false,
                                    data: user.videoPlaying
                                });
                            }
                        } else {
                            user.videoPlaying = [data.id];
                            socket.emit('play', {
                                play: true,
                                data: user.videoPlaying
                            });
                        }
                    } else {
                        if (user.videoPlaying) {
                            if (!user.videoPlaying.includes(data.id)) {
                                user.videoPlaying.push(data.id);
                                socket.emit('play', {
                                    play: true,
                                    data: user.videoPlaying,
                                    lastVideo : lastProgram
                                });
                                user.hasService = Date.now();
                                this.startTimePlay(data, user, userProgram);
                            } else {
                                let count = {};
                                user.videoPlaying.forEach(function (i) { count[i] = (count[i] || 0) + 1; });
                                if (count[data.id] <= 1) {
                                    socket.emit('play', {
                                        play: true,
                                        data: count[data.id],
                                        lastVideo : lastProgram
                                    });
                                    user.videoPlaying.push(data.id);
                                    user.hasService = Date.now();
                                    this.startTimePlay(data, user, userProgram);
                                } else {
                                    socket.emit('play', {
                                        play: false,
                                        data: user.videoPlaying
                                    });
                                }
                            }
                        } else {
                            user.videoPlaying = [data.id];
                        }
                    }
                }
                // console.log('play');
                // console.log(user.videoPlaying);
                await user.updateOne({ videoPlaying: user.videoPlaying, hasService: user.hasService });
            }
        } catch (error) {
            console.log('Error function checkPlay : ' + JSON.stringify(socket.userData));
        }
    }

    async startTimePlay(data, user, userProgram) {
        try {
            // set time play video
            // if (socket.userData.id && user && !socket.userData.check) {
            // console.log("Start play - id " + data.id + ' - ' + moment().unix());
            if (data.id && user) {
                if (userProgram.timeplays && Object.entries(userProgram.timeplays).length > 0) {
                    userProgram.timeplays[data.id] = new Date().getTime() / 1000;
                } else {
                    userProgram.timeplays = { [data.id]: new Date().getTime() / 1000 };
                }

                if (userProgram.lastProgram) {
                    let check = false;

                    userProgram.lastProgram.filter((item, i) => {
                        if (item[data.idParent]) {
                            check = true;
                            item[data.idParent] = data.id;
                        }
                    });
    
                    if (!check && userProgram.lastProgram) {
                        if (userProgram.lastProgram.length >= 10) {
                            userProgram.lastProgram.shift();
                        }
                        if (data.idParent && data.id) {
                            userProgram.lastProgram.push({[data.idParent]: data.id});
                        }
                    }
                } else {
                    if (data.idParent && data.id) {
                        userProgram.lastProgram = [];
                        userProgram.lastProgram.push({[data.idParent]: data.id});
                    }
                }


                // console.log('save user program - ' + data.id);
                // console.log(userProgram.timeplays);
                await userProgram.updateOne({ 
                    timeplays: userProgram.timeplays, 
                    lastProgram: userProgram.lastProgram
                });
                // console.log('start - ' + data.id + ' - ' + userProgram.lastProgram);
                // console.log('Start - end' + moment().unix())
                return true;
            }
        } catch (error) {
            return false;
        }
    }

    async disconnect(socket) {
        try {
            if (socket.userData && socket.userData.membership) {
                const decoded = jwt.verify(socket.userData.token, keyToken);
                const user = await userModel.findOne({ _id: decoded._id });
                if (user.videoPlaying) {
                    user.videoPlaying = user.videoPlaying.filter((data) => {
                        return data != socket.userData.id;
                    });
                    await user.updateOne({ videoPlaying: user.videoPlaying });
                }
                // console.log('disconnect');
                // console.log(user.videoPlaying);
                // let result = this.endTimePlay(socket);
                return true;
            }
        } catch (error) {
            return false;
            // console.log('Error function disconnect : ' + JSON.stringify(socket.datas));
        }
    }

    async endTimePlay(socket, data, user) {
        try {
            if (data && user) {
                let program = await programModel.findOne({ _id: data.id });
                let userProgram = await userProgramModel.findOne({ userID: user._id });
                // console.log(socket.id + ' - ' + 
                // data.id + ' - ' + 
                // data.time + ' - ' +
                // moment().unix());
                if ((typeof data.time != 'undefined') && user) {
                    let check = false;
                    if (userProgram) {
                        userProgram.programIDs.filter((item, i) => {
                            if (item.id == data.id) {
                                item.time = data.time;
                                check = true;
                            }
                        });

                        if (!check && userProgram.programIDs) {
                            if (userProgram.programIDs.length >= 20) {
                                userProgram.programIDs.shift();
                            }
                            userProgram.programIDs.push({
                                id: data.id,
                                time: data.time
                            });
                        }
                    } else {
                        await userProgramModel({
                            userID: user._id,
                            programIDs: [{
                                id: data.id,
                                time: data.time
                            }]
                        }).save();
                    }
                }

                //save time player
                // await userProgram.updateOne({
                //     programIDs: userProgram.programIDs
                // });
                // console.log('id stop - '+ socket.userData.id + ' id data ' + data.id + ' - ' + moment().unix());
                // console.log('if' + ' - ' + userProgram?.timeplays[socket.userData.id] + ' - ' + userProgram?.timeplays[data.id]);
                if (userProgram?.timeplays[data.id]) {
                    let timeEnd = new Date().getTime() / 1000;
                    let time = parseFloat((timeEnd - userProgram.timeplays[data.id]).toFixed(2));
                    let date = new Date();
                    let month = date.getMonth() + 1;
                    let year = date.getFullYear();
                    // console.log('end time');
                    // console.log(time);
                    delete userProgram.timeplays[data.id];
                    // if (program.programView && user._id != program.userID)  {
                    if (program.programView) {
                        if (program.programView[year] &&
                            program.programView[year][month]
                        ) {
                            if (socket.userData.membership === constants.MEMBER_SHIP.BASIC) {
                                program.programView[year][month][constants.MEMBER_SHIP.BASIC] = 
                                parseFloat(program.programView[year][month][constants.MEMBER_SHIP.BASIC].toFixed(2)) + time;
                            } else if (socket.userData.membership === constants.MEMBER_SHIP.STANDARD) {
                                program.programView[year][month][constants.MEMBER_SHIP.STANDARD] = 
                                parseFloat(program.programView[year][month][constants.MEMBER_SHIP.STANDARD].toFixed(2)) +  time;
                            } else if (socket.userData.membership === constants.MEMBER_SHIP.PREMIUM) {
                                program.programView[year][month][constants.MEMBER_SHIP.PREMIUM] = 
                                parseFloat(program.programView[year][month][constants.MEMBER_SHIP.PREMIUM].toFixed(2)) + time;
                            }
                        }
                    }

                    //task VT04P002CD-178
                    // if (userProgram?.timePlayVideos) {
                    //     let abusingTime = 0;
                    //     Object.entries(userProgram?.timePlayVideos).forEach(([v, timeAbusing]) => {
                    //         abusingTime += timeAbusing;
                    //     });

                    //     if (userProgram?.timePlayVideos[socket.userData.id]) {
                    //         userProgram.timePlayVideos[socket.userData.id] += time;
                    //         let detail = Object.keys(userProgram.timePlayVideos);
                    //         if (userProgram.timePlayVideos[socket.userData.id] > 0) {
                    //             let key = moment().tz("Asia/Seoul")
                    //                         .startOf('isoWeek')
                    //                         .add(0, 'week')
                    //                         .format('yyyyMMDD') +  moment().tz("Asia/Seoul")
                    //                         .endOf('isoWeek')
                    //                         .add(0, 'week')
                    //                         .format('yyyyMMDD');
                    //             let abusing = await abusingModel.findOne({
                    //                 userID : user.id,
                    //                 timeFlowWeek: key
                    //             });  

                    //             if (!rsService.isEmpty(abusing)) {
                    //                 await abusing.updateOne({ 
                    //                     userName: user.userName,
                    //                     userEmail: user.userEmail,
                    //                     info: userProgram.timePlayVideos,
                    //                     detail: detail
                    //                 });
                    //             } else {
                    //                 if (abusingTime >= H15) {
                    //                     //check reason delay
                    //                     // let check = await abusingModel.findOne({
                    //                     //     userID : user.id,
                    //                     //     timeFlowWeek: key
                    //                     // }); 
                    //                     // if (rsService.isEmpty(check)) {
                    //                     //     await abusingModel.create({
                    //                     //         userID : user.id,
                    //                     //         userEmail: user.userEmail,
                    //                     //         userName: user.userName,
                    //                     //         timeFlowWeek: key,
                    //                     //         info: userProgram.timePlayVideos
                    //                     //     })
                    //                     // }
                    //                     await abusingModel.create({
                    //                         userID : user.id,
                    //                         userEmail: user.userEmail,
                    //                         userName: user.userName,
                    //                         timeFlowWeek: key,
                    //                         info: userProgram.timePlayVideos,
                    //                         detail: detail
                    //                     })
                    //                 }
                    //             }
                    //         }
                    //     } else {
                    //         //user first play video
                    //         userProgram.timePlayVideos[socket.userData.id] =  time;
                    //         let detail = Object.keys(userProgram.timePlayVideos);
                    //         if (userProgram.timePlayVideos[socket.userData.id] > 0) {
                    //             let key = moment().tz("Asia/Seoul")
                    //                         .startOf('isoWeek')
                    //                         .add(0, 'week')
                    //                         .format('yyyyMMDD') +  moment().tz("Asia/Seoul")
                    //                         .endOf('isoWeek')
                    //                         .add(0, 'week')
                    //                         .format('yyyyMMDD');
                    //             let abusing = await abusingModel.findOne({
                    //                 userID : user.id,
                    //                 timeFlowWeek: key
                    //             });  

                    //             if (!rsService.isEmpty(abusing)) {
                    //                 await abusing.updateOne({ 
                    //                     userName: user.userName,
                    //                     userEmail: user.userEmail,
                    //                     info: userProgram.timePlayVideos,
                    //                     detail: detail
                    //                 });
                    //             } else {
                    //                 if (abusingTime >= H15) {
                    //                     await abusingModel.create({
                    //                         userID : user.id,
                    //                         userEmail: user.userEmail,
                    //                         userName: user.userName,
                    //                         timeFlowWeek: key,
                    //                         info: userProgram.timePlayVideos,
                    //                         detail: detail
                    //                     })
                    //                 }
                    //             }
                    //         }
                    //     }    
                    // } else {
                    //     userProgram.timePlayVideos = {[socket.userData.id] : time} ;
                    // }
                    // console.log(time);
                    userProgram.accumlative += time;

                    user.videoPlaying = user.videoPlaying.filter((_data) => {
                        return _data != socket.userData.id;
                    });
                    await program.updateOne({
                        timePlay: '',
                        programView: program.programView,
                        videoPlaying: user.videoPlaying
                    });
                    // console.log('First save' + ' - ' + data.time);
                    if (userProgram && (typeof data.time != 'undefined')) {
                        // console.log(userProgram.toJSON());
                        if (parseInt(data.time) == 0) {
                            userProgram.lastProgram = userProgram.lastProgram.filter((item, i) => {
                                if (item[data.idParent]) {
                                   return false;
                                }
                                return true;
                            });
                        }


                        // console.log(socket.userData);
                        // console.log('end - ' + socket.userData.id + ' - ' 
                        // + data.time);
                        // console.log(userProgram.programIDs);
                        // console.log('-------------------------------');
                    }
                }

                await userProgram.updateOne({
                    programIDs: userProgram.programIDs,
                    timeplays: userProgram.timeplays,
                    // timePlayVideos: userProgram.timePlayVideos,
                    accumlative: userProgram.accumlative,
                    lastProgram: userProgram.lastProgram
                });
                // console.log('Stop - end' + moment().unix());
                return true;
            }
            // end time play video
        } catch (error) {
            return true;
        }
    }

    async stopVideo(socket) {
        try {
            if (socket.userData) {
                // console.log(socket.id);
                // console.log('Stop - ' + socket.userData.id);
                // console.log(socket.userData);
                let data = socket.userData;
                const decoded = jwt.verify(socket.userData.token, keyToken);
                const user = await userModel.findOne({ _id: decoded._id });
                let memberShip = await memberShipModel.findOne({ _id: user.userMembership });
                let check = false;
                if (user.videoPlaying) {
                    user.videoPlaying = user.videoPlaying.filter((_data) => {
                        if (!check) {
                            check = true;
                            return _data != socket.userData.id;
                        }
                    });
                    await user.updateOne({ videoPlaying: user.videoPlaying });
                }
                socket.userData.membership = memberShip.packageName;
                data.membership = memberShip.packageName;
                // console.log('stop');
                // console.log(user.videoPlaying);
                this.endTimePlay(socket, data, user);
                socket.emit('stop', { msg: 'stop video done' });
            }
        } catch (error) {
            return false;
            // console.log('Error function disconnect : ' + JSON.stringify(socket.datas));
        }
    }

    async resumeVideo(socket) {
        try {
            
            // console.log(socket.userData);socket.userDatasocket.userDatasocket.userDatasocket.userData
            let dataPost = socket.userData;
            if (dataPost.id && dataPost.time != 0) {
                // const decoded = jwt.verify(socket.userData.token, keyToken);
                // const user = await userModel.findOne({ _id: decoded._id }).lean();
                let program = await programModel.findOne({ _id: dataPost.id });
                let userProgram = await userProgramModel.findOne({ userID: dataPost.uid });
                // let memberShip = await memberShipModel.findOne({ _id: dataPost.mS }).lean();

                if (dataPost.time) {
                    let check = false; 
                    
                    if (userProgram && userProgram.programIDs) {
                        userProgram.programIDs.filter((item, i) => {
                            if (item.id == dataPost.id) {
                                item.time = dataPost.time;
                                check = true;
                            }
                        });

                        if (!check && userProgram.programIDs) {
                            if (userProgram.programIDs.length >= 20) {
                                userProgram.programIDs.shift();
                            }
                            userProgram.programIDs.push({
                                id: dataPost.id,
                                time: dataPost.time
                            });
                        }
                    } else {
                        userProgram = await userProgramModel({
                            userID: user._id,
                            programIDs: [{
                                id: dataPost.id,
                                time: dataPost.time
                            }]
                        }).save();
                    }
                }

                if (userProgram?.timeplays && userProgram?.timeplays[dataPost.id]) {
                    let timeEnd = new Date().getTime() / 1000;
                    let time = parseFloat((timeEnd - userProgram.timeplays[dataPost.id]).toFixed(2));
                    let date = new Date();
                    let month = date.getMonth() + 1;
                    let year = date.getFullYear();
                    // console.log(time);
                    delete userProgram.timeplays[dataPost.id];
                    if (program.programView) {
                        if (program.programView[year] &&
                            program.programView[year][month]
                        ) {
                            if (dataPost.mS === constants.MEMBER_SHIP.BASIC) {
                                program.programView[year][month][constants.MEMBER_SHIP.BASIC] = 
                                parseFloat(program.programView[year][month][constants.MEMBER_SHIP.BASIC].toFixed(2)) + time;
                            } else if (dataPost.mS === constants.MEMBER_SHIP.STANDARD) {
                                program.programView[year][month][constants.MEMBER_SHIP.STANDARD] = 
                                parseFloat(program.programView[year][month][constants.MEMBER_SHIP.STANDARD].toFixed(2)) +  time;
                            } else if (dataPost.mS === constants.MEMBER_SHIP.PREMIUM) {
                                program.programView[year][month][constants.MEMBER_SHIP.PREMIUM] = 
                                parseFloat(program.programView[year][month][constants.MEMBER_SHIP.PREMIUM].toFixed(2)) + time;
                            }
                        }
                    }

                    await program.updateOne({
                        timePlay: '', 
                        programView: program.programView
                    });

                    userProgram.accumlative += time;
                } else {
                    userProgram.timeplays = { [dataPost.id]: new Date().getTime() / 1000 };
                }

                await userProgram.updateOne({
                    programIDs: userProgram.programIDs,
                    timeplays: userProgram.timeplays,
                    // timePlayVideos: userProgram.timePlayVideos,
                    accumlative: userProgram.accumlative,
                    lastProgram: userProgram.lastProgram
                });

                socket.emit('resume', { msg: 'resume video done' });
                // console.log('Resume - end' + moment().unix());
                return true;
            }
        } catch (error) {
            return false;
            // console.log('Error function disconnect : ' + JSON.stringify(socket.datas));
        }
    }
}

module.exports = new SocketController();
