#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { TinyurlStack } from '../lib/tinyurl-stack';

const app = new cdk.App();
new TinyurlStack(app, 'TinyurlStack');
