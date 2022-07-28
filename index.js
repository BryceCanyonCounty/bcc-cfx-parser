var fs = require("fs");
var request = require("request");
var axios = require("axios")
var moment = require("moment")

var options = {
  method: "GET",
  url: "https://servers-frontend.fivem.net/api/servers/stream",
  gzip: true,
  headers: {
    Referer: "https://servers.fivem.net/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
  },
};

function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

console.log("Obtaining Server List...");
request(options, async function (error, response) {
    if (error) throw new Error(error);
    console.log("Server List Obtained!");
    let splited = response.body.split("\n");

    let parsed = [];
    let output = []

    console.log("Parsing Server List...");
    for (let index = 0; index < splited.length; index++) {
        const element = splited[index];
        const l = element.match(
        `\\u0006[a-z0-9][a-z0-9][a-z0-9][a-z0-9][a-z0-9][a-z0-9]`
        );
        if (l) {
            let cleaned = l[0].replace("\u0006", "");

            if (cleaned !== "locale") {
                parsed.push(cleaned);
            }
        }
    }

    console.log("Detected Server IDs:", parsed.length);

    console.log("Grabing each server...");
    // for (let pos = 0; pos < parsed.length; pos++) {
    for (let pos = 0; pos < 5; pos++) {
        const id = parsed[pos];
        console.log("Grabing ", id);

        var config = {
        method: "get",
        url: "https://servers-frontend.fivem.net/api/servers/single/"+id,
        headers: {
            Referer: "https://servers.fivem.net/",
            "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
        },
        };

        var [parents] = await Promise.all([
        axios(config)
            .then(function (response) {
                output.push(response.data);
            return;
            })
            .catch(function (error) {
                console.log(error);
            }),
        timeout(Math.floor(Math.random() * (1000 - 500 + 1) + 500)),
        ]);
    }
    console.log("Saved Server:", output.length);
    fs.writeFile("servers.json", JSON.stringify(output), "utf8", (err) => {
        if (err) {
        console.error(err);
        return;
        }

        console.log("Stored Server IDs:", output.length);
        console.log("Successfully written data to file (data.json)!");
        
        gatherData(output)
    });
});


function gatherData(data) {
    console.log("Begin Analyzing data...");
    let fivem = {
        players: 0,
        resources: {}
    }

    let redm = {
        players: 0,
        resources: {}
    }

    for (let p = 0; p < data.length; p++) {
        const server = data[p].Data;
        console.log("Analyzing data", p);

        if (server.vars.gamename == 'gta5') {
            fivem.players += server.players.length
            
            for (let ps = 0; ps < server.resources.length; ps++) {
                const resource = server.resources[ps];
                
                
                if (resource in fivem.resources) {
                    fivem.resources[`${resource}`]++
                } else {
                    fivem.resources[`${resource}`] = 1
                }
            }
        } else if (server.vars.gamename == 'rdr3') {
            redm.players += server.players.length

            for (let ps = 0; ps < server.resources.length; ps++) {
                const resource = server.resources[ps];
                
                if (redm.resources[resource]) {
                    redm.resources[resource]++
                } else {
                    redm.resources[resource] = 0
                }
            }
        }
    }
    
    var date = new Date();
    var formattedDate = moment(date).format('YYYY_MM_DD');

    let gta = `analyzed_fivem_${formattedDate}.json`
    fs.writeFile(gta, JSON.stringify(fivem), "utf8", (err) => {
        if (err) {
            console.error(err);
            return;
        }

       
        console.log(`FiveM analysis is done and successfully written to (${gta})!`);
    });

    let rdm = `analyzed_redm_${formattedDate}.json`
    fs.writeFile(rdm, JSON.stringify(redm), "utf8", (err) => {
        if (err) {
            console.error(err);
            return;
        }

       
        console.log(`RedM analysis is done and successfully written to (${rdm})!`);
    });
}