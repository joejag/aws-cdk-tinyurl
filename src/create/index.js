const AWS = require("aws-sdk")
const Hashids = require("hashids/cjs")
const hashids = new Hashids()

var rdsdataservice = new AWS.RDSDataService({ apiVersion: "2018-08-01" })

exports.handler = async function (event, context) {
  const urlToShorten = JSON.parse(event.body).url

  const params = {
    secretArn: process.env.SECRET_ARN,
    resourceArn: process.env.CLUSTER_ARN,
    database: "urls",
    sql: "INSERT INTO urls (url) VALUES (:url)",
    parameters: [{ name: "url", value: { stringValue: urlToShorten } }],
  }

  try {
    const dbResponse = await rdsdataservice.executeStatement(params).promise()
    const newId = dbResponse.generatedFields[0].longValue
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,GET,POST,DELETE",
      },
      body: JSON.stringify({ id: hashids.encode(newId) }),
    }
  } catch (error) {
    console.log(error)
    return error
  }
}

// CREATE TABLE urls (
//   id int NOT NULL AUTO_INCREMENT,
//   url varchar(4000)  NOT NULL,
//   PRIMARY KEY (id)
// );
