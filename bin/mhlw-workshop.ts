#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MHLWWorkshopStack } from "../lib/mhlw-workshop-stack";
import { Template } from "aws-cdk-lib/assertions";
import { DefaultStackSynthesizer } from "aws-cdk-lib";

const app = new cdk.App();
const stack = new MHLWWorkshopStack(app, "MHLWWorkshopStack", {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false,
  }),
});

const cfn = Template.fromStack(stack);

console.log(JSON.stringify(cfn.toJSON()));
