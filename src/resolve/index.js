const AWS = require("aws-sdk")
const Hashids = require("hashids/cjs")
const hashids = new Hashids()

var rdsdataservice = new AWS.RDSDataService({ apiVersion: "2018-08-01" })

exports.handler = async function (event, context) {
  const { urlId } = event.pathParameters
  const decodedId = hashids.decode(urlId)[0]

  const params = {
    secretArn: process.env.SECRET_ARN,
    resourceArn: process.env.CLUSTER_ARN,
    database: "urls",
    sql: "SELECT url FROM urls WHERE id = :id",
    parameters: [{ name: "id", value: { longValue: decodedId } }],
  }

  try {
    const dbResponse = await rdsdataservice.executeStatement(params).promise()
    return {
      statusCode: 301,
      headers: { Location: dbResponse.records[0][0].stringValue },
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
