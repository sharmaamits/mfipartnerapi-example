const authenticatiion = require('../../../auth/authenticate.js');
const async = require('async');
const bookbullionrate = require('./bookbullionrate');
var testPaySipInstallment = function () {
    const extCustomerId = "DVMFIBR002CST001";
    const sipId = "18e1cacb-df4c-11e9-8cf2-bf3bc5ab95d9";
    const bullion = {
        id : "G1",
        bullionShortName : "GD24K - 999",
        bullionName : "Gold",
        purity : {
            displayValue : "24Kt - (99.9%)",
            value : "999"
        },
        status : "available"
    }
    authenticatiion.authenticateClient(function (err, client) {
        if (client) {
            async.waterfall([
                function(next){
                    bookbullionrate.bookBullionRate(
                                                client,
                                                extCustomerId,
                                                bullion.name,
                                                bullion.id,
                                                "sipBuy",
                                                next);
                },
                function(bullionRate,next){
                    console.dir(bullionRate);
                    const aBookedRate = bullionRate[0];
                    if(aBookedRate){
                        const sipOrder = {
                            agent:{extAgentId:'EXTAGT007',name:{first:"Koshi",middle:"Venkateshwara",last:"Shaikh"}}, //An Agent that is not known to MyGold.
                            bullion:bullion, //need a valid bullion id
                            bullionRateId:aBookedRate.id, //bullion rateid got through rate booking.
                            sipId:sipId, //id of a setup customer is part of.
                            orderTotalValueInr:1000,  //can be 0 to skip an installment.                           
                            taxRates:bullionRate.taxRates
                        }
                        next(null,sipOrder);                        
                        
                    }
                    else{
                        next("Unable to book a bullion rate for this txn");
                    }
                },
                function(sipOrder,next){
                    sendPaySipInsyallment(client,extCustomerId,sipOrder,next);
                }
            ],function(err,result){
                if(err){
                    console.error(err)
                }
                else{
                    console.dir(result);
                }
            })
            //sendPaySipInsyallment(client, callback);
        }
        else {
            console.error(err);
        }
    })
}

var sendPaySipInsyallment = function (client,extCustomerId,sipOrder,callback) {
    
    client
        .invokeApi(null, `/customers/${extCustomerId}/siporders`,
            'POST', {},
            sipOrder
        )
        .then(function (result) {
            callback(null,result.data)
        })
        .catch(function (result) {
            if (result.response) {
                callback({
                    status: result.response.status,
                    statusText: result.response.statusText,
                    data: result.response.data
                });
            } else {
                callback(result.message);
            }
        });
}

testPaySipInstallment();