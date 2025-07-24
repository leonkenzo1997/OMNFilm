const programModel = require('../app/Models/Program/ProgramModel');

async function script () {
    console.log('START')
    const programs = await programModel.find({
        programType: 'original'
    })

    const programOriginalPosters = [
        'https://omn-image-input.s3.ap-northeast-2.amazonaws.com/Original/OriginalImage/08_2021/08/Myzzu.jpg',
        'https://omn-image-input.s3.ap-northeast-2.amazonaws.com/Original/OriginalImage/08_2021/08/OMN.jpg',
        'https://omn-image-input.s3.ap-northeast-2.amazonaws.com/Original/OriginalImage/08_2021/08/missionmukpossible.jpg',
        'https://omn-image-input.s3.ap-northeast-2.amazonaws.com/Original/OriginalImage/08_2021/08/NDM.jpg',
        'https://omn-image-input.s3.ap-northeast-2.amazonaws.com/Original/OriginalImage/08_2021/08/cindysmakeup.jpg'
    ]

    let i = 0
    await Promise.all(programs.map(async program => {
        if (i > 4) i = 0
        program.programOriginalPoster = programOriginalPosters[i++]
        await program.save()
    }))

    console.log('DONE')
}

script()