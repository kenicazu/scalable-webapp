import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import { readFileSync } from 'fs';

export class ScalableStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // リソースをデプロイするためのVPCの定義 
    const vpc = new ec2.Vpc(this, "handson-vpc", {
      cidr: "10.0.0.0/16",
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security group for the EC2 instance
    const securityGroup = new ec2.SecurityGroup(this, "web-security-group", {
      vpc,
      description: "Allow SSH (TCP port 22) and HTTP (TCP port 80) in",
      allowAllOutbound: true,
    });

    // Allow SSH access on port tcp/22
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow SSH Access"
    );

    // Allow HTTP access on port tcp/80
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP Access"
    );

    // EC2用のロール作成
    const ec2role = new iam.Role(this, "access_ssm_role_handson", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    //Session Manager用のマネージドポリシーの定義
    ec2role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );

    // Look up the AMI Id for the Amazon Linux 2 Image with CPU Type X86_64
    const ami = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    // Create the EC2 instance using the Security Group, AMI.
    const ec2Instance = new ec2.Instance(this, "webserver#1", {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ami,
      securityGroup: securityGroup,
      role: ec2role,
    });

    // Add user data
    const userDataScript = readFileSync('./lib/user-data.sh', 'utf8');
    ec2Instance.addUserData(userDataScript);
  }
}
