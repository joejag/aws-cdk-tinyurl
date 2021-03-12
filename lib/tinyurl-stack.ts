import * as cdk from "@aws-cdk/core"
import * as rds from "@aws-cdk/aws-rds"
import * as lambda from "@aws-cdk/aws-lambda"
import * as ec2 from "@aws-cdk/aws-ec2"
import * as apigateway from "@aws-cdk/aws-apigateway"

export class TinyurlStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const vpc = new ec2.Vpc(this, "MyVPC")

    const cluster = new rds.ServerlessCluster(this, "AnotherCluster", {
      engine: rds.DatabaseClusterEngine.AURORA_MYSQL,
      vpc,
    })

    const fn = new lambda.Function(this, "MyFunction", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("src/create"),
      environment: {
        CLUSTER_ARN: cluster.clusterArn,
        SECRET_ARN: cluster.secret?.secretArn || "oh no",
      },
    })
    cluster.grantDataApiAccess(fn)

    const getFn = new lambda.Function(this, "MyGetFunction", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("src/resolve"),
      environment: {
        CLUSTER_ARN: cluster.clusterArn,
        SECRET_ARN: cluster.secret?.secretArn || "oh no",
      },
    })
    cluster.grantDataApiAccess(getFn)

    const api = new apigateway.RestApi(this, "some-api")
    api.root.addMethod("POST", new apigateway.LambdaIntegration(fn))
    api.root.addResource("{urlId}").addMethod("GET", new apigateway.LambdaIntegration(getFn))
  }
}
