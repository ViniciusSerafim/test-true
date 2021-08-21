const fs = require('fs');
const https = require('https'); // or 'https' for https:// URLs
const decompress = require('decompress');
const readline = require('readline')
const csv = require('csvtojson')
const {zip} = require('zip-a-folder')


const downloadZip = async () => {
    const file = fs.createWriteStream("file.zip");

    return new Promise((resolve) => {
        const request = https.get("https://datawarehouse-true.s3-sa-east-1.amazonaws.com/teste-true/teste_true_term.zip", async (response) => {
            response.pipe(file);
            resolve()
        });
    })
}

const decompressFile = async () => {
    return new Promise((resolve) => {
        try {
            const files = decompress('file.zip', 'dist')
            console.log('done')
            resolve()
        } catch (e) {
            console.log(e)
            resolve()
        }
    })
};

const main = async () => {
    await downloadZip()
    await decompressFile().then(async (res) => {
        setTimeout(async () => {
            const fileStream = fs.createReadStream('dist/TERM.DAT');

            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });
            // Note: we use the crlfDelay option to recognize all instances of CR LF
            // ('\r\n') in input.txt as a single line break.
            const array = []
            for await (const line of rl) {
                let flag = false
                let startIndex = 0

                const subArray = []
                for (let i = 0; i < line.length; i++) {
                    if (!flag) {
                        if (line[i] !== ' ') {
                            startIndex = i
                            flag = true
                        }
                    } else {
                        if (line[i] === ' ' || i === line.length - 1) {
                            subArray.push(line.slice(startIndex, i+1))
                            flag = false
                        }
                    }
                }
                array.push(subArray)
            }




            const csvFilePath = 'dist/encad-termicas.csv'
            csv()
                .fromFile(csvFilePath)
                .then((jsonObj) => {
                })

            // Async / await usage
            const jsonArray = await csv().fromFile(csvFilePath);

            for (let i = 0; i < array.length; i++) {
                for (let k = 0; k < jsonArray.length; k++) {
                    if (array[i][0] === jsonArray[k].numeroUsina) {
                        array[i][2] = jsonArray[k].capInstalada
                        array[i][3] = jsonArray[k].fatorCapacidadeMax
                        array[i][4] = jsonArray[k].teif
                        array[i][5] = jsonArray[k].indispProgramada
                        array[i][6] = jsonArray[k].jan
                        array[i][7] = jsonArray[k].fev
                        array[i][8] = jsonArray[k].mar
                        array[i][9] = jsonArray[k].abr
                        array[i][10] = jsonArray[k].mai
                        array[i][11] = jsonArray[k].jun
                        array[i][12] = jsonArray[k].jul
                        array[i][13] = jsonArray[k].ago
                        array[i][14] = jsonArray[k].set
                        array[i][15] = jsonArray[k].out
                        array[i][16] = jsonArray[k].nov
                        array[i][17] = jsonArray[k].dez
                        array[i][18] = jsonArray[k].futuro
                    }
                }
            }

            let content = ''

            for (let i = 0; i < array.length ; i++) {
                for (let k = 0; k < array[i].length ; k++) {
                    content =content + array[i][k]
                }
                content = content + "\n"
            }


            fs.writeFile('dist/TERM_TRUE.DAT', content, err => {
                if (err) {
                    console.error(err)
                    return
                }
            })

            await zip('dist', 'outputZip.zip');
         
        }, 2500)
    })
}



main()



