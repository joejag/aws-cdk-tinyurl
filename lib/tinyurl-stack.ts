import * as cdk from "@aws-cdk/core"
import * as rds from "@aws-cdk/aws-rds"
import * as lambda from "@aws-cdk/aws-lambda"
import * as ec2 from "@aws-cdk/aws-ec2"
import * as apigateway from "@aws-cdk/aws-apigateway"
import * as cloudfront from "@aws-cdk/aws-cloudfront"
import * as origins from "@aws-cdk/aws-cloudfront-origins"
import * as s3 from "@aws-cdk/aws-s3"
import * as s3deploy from "@aws-cdk/aws-s3-deployment"

export class TinyurlStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // database

    const vpc = new ec2.Vpc(this, "MyVPC")

    const cluster = new rds.ServerlessCluster(this, "AnotherCluster", {
      engine: rds.DatabaseClusterEngine.AURORA_MYSQL,
      vpc,
    })

    // api endpoints

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

    const api = new apigateway.RestApi(this, "some-api", {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
      },
    })
    api.root.addMethod("POST", new apigateway.LambdaIntegration(fn))
    api.root.addResource("{urlId}").addMethod("GET", new apigateway.LambdaIntegration(getFn))

    // front-end

    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
    })

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
      },
    })

    new s3deploy.BucketDeployment(this, "DeployWithInvalidation", {
      sources: [s3deploy.Source.asset("src/app/build")],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ["/*"],
    })
  }
}
