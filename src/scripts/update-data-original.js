const programModel = require('../app/Models/Program/ProgramModel');
const programOriginalConstant = require('../app/Constant/ProgramOriginal/ProgramOriginalConstant');
const programOriginalController = require('../app/Controllers/Admin/ProgramOriginal/ProgramOriginalController');

async function script () {
    console.log('START')
    const programs = await programModel.find({
        programType: 'original'
    })

    const img = [
        'https://omn-image-input.s3.ap-northeast-2.amazonaws.com/Original/OriginalImage/08_2021/08/Myzzu.jpg',
        'https://omn-image-input.s3.ap-northeast-2.amazonaws.com/Original/OriginalImage/08_2021/08/NDM.jpg',
        'https://omn-image-input.s3.ap-northeast-2.amazonaws.com/Original/OriginalImage/08_2021/08/OMN.jpg',
        'https://omn-image-input.s3.ap-northeast-2.amazonaws.com/Original/OriginalImage/08_2021/08/cindysmakeup.jpg',
        'https://omn-image-input.s3.ap-northeast-2.amazonaws.com/Original/OriginalImage/08_2021/08/missionmukpossible.jpg'
    ]

    const img2 = [
        'https://omn-image-input.s3.ap-northeast-2.amazonaws.com/Upload/Poster/02_2021/25/1.poster_with_titl_60337d09d99fca02376af919_1618912736e.jpg',
        'https://omn-image-input.s3.ap-northeast-2.amazonaws.com/Upload/Poster/07_2021/28/1.poster_with_tiltl_604aed592e302a02b09e8a7d_1627465153e.jpg',
        'https://omn-image-input.s3.ap-northeast-2.amazonaws.com/Upload/Poster/07_2021/29/1._Poster_with_title_RS_604aed592e302a02b09e8a7d_1627577381.png',
        'https://omn-image-input.s3.ap-northeast-2.amazonaws.com/Upload/Poster/07_2021/29/Poster_Titl_604aed592e302a02b09e8a7d_1627571267e.jpg',
        'https://omn-image-input.s3.ap-northeast-2.amazonaws.com/Upload/Poster/05_2021/05/1.Poster_with_Titl_608936308e8e0c014fb7830b_1620210571e.jpg'
    ]

    let i = 0
    await Promise.all(programs.map(async program => {
        if (i === 5) i = 0
        const programImage = img2[i++]

        program.programImagePoster = programImage

        await program.save()
    }))

    console.log('DONE')
}

script()