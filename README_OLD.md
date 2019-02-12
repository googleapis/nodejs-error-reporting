# Stackdriver Error Reporting for Node.js

[![NPM Version][npm-image]][npm-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]

> **Beta** *This is a Beta release of the Stackdriver Error Reporting libraries for Node.js. These libraries might be changed in backward-incompatible ways and are not subject to any SLA or deprecation policy.*


## Prerequisites

1. Your application needs to use Node.js version 4.x or greater.
1. You need a [Google Cloud project](https://console.cloud.google.com). Your application can run anywhere, but errors are reported to a particular project.
1. [Enable the Stackdriver Error Reporting API](https://console.cloud.google.com/apis/api/clouderrorreporting.googleapis.com/overview) for your project.

## Running on Google Cloud Platform

All information in this section assumes that the items in the [Prerequisites](#prerequisites) section above have been completed.

### Google App Engine Flexible environment

If you are using [Google App Engine flexible environment](https://cloud.google.com/appengine/docs/flexible/), you do not have to do any additional configuration.

### Google Compute Engine

Your VM instances need to be created with the `https://www.googleapis.com/auth/cloud-platform` scope if created via the [gcloud](https://cloud.google.com/sdk) CLI or the Google Cloud Platform API, or by enabling at least one of the Stackdriver APIs if created through the browser-based console.

If you already have VMs that were created without API access and do not wish to recreate it, you can follow the instructions for using a service account under [running elsewhere](#running-elsewhere).

### Google Container Engine

As with Compute Engine, Container Engine nodes need to be created with the `https://www.googleapis.com/auth/cloud-platform` scope, which is configurable during cluster creation:
* If the cluster is being created with the `gcloud` CLI, pass the scope to the command with the `--scopes` command (multiple scopes can be [delimited with a comma](https://cloud.google.com/sdk/gcloud/reference/container/clusters/create)):

  ```sh
  gcloud container clusters create example-cluster-name --scopes https://www.googleapis.com/auth/cloud-platform
  ```

* If the cluster is being created through the Cloud Console UI, ensure that the "Cloud Platform" project access is set to "Enabled" (it's disabled by default).

Alternatively, you can also follow the instructions for using a service account under [running elsewhere](#running-elsewhere). It's recommended that you store the service account credentials as [Kubernetes Secret](http://kubernetes.io/v1.1/docs/user-guide/secrets.html).

## Running Elsewhere

If your application is running outside of Google Cloud Platform, such as locally, on-premise, or on another cloud provider, you can still use Stackdriver Errors either with locally-stored credentials or with an API Key.

### Using Locally-Stored Credentials

1. You will need to specify your project ID when starting the errors agent.

    ```sh
    GCLOUD_PROJECT=particular-future-12345 node myapp.js
    ```

1. You need to provide service account credentials to your application by using one of the three options below:
  * The recommended way is via [Application Default Credentials][app-default-credentials].
    1. [Create a new JSON service account key][service-account].
    1. Copy the key somewhere your application can access it. Be sure not to expose the key publicly.
    1. Set the environment variable `GOOGLE_APPLICATION_CREDENTIALS` to the full path to the key. The Error Reporting library will automatically look for this environment variable.
  * If you are running your application on a development machine or test environment where you are using the [`gcloud` command line tools][gcloud-sdk], and are logged using `gcloud beta auth application-default login`, you already have sufficient credentials, and a service account key is not required.
  * Alternatively, you may set the `keyFilename` or `credentials` configuration field to the full path or contents to the key file, respectively. Setting either of these fields will override either setting `GOOGLE_APPLICATION_CREDENTIALS` or logging in using `gcloud`. For example:

    ```js
    // Require and start the agent with configuration options
    const errors = require('@google-cloud/error-reporting')({
      // The path to your key file:
      keyFilename: '/path/to/keyfile.json',

      // Or the contents of the key file:
      credentials: require('./path/to/keyfile.json')
    });
    ```

When running on Google Cloud Platform, we handle these for you automatically.

### Using an API Key

You may use an API key in lieu of locally-stored credentials. Please see [this document][api-key] on how to set up an API key if you do not already have one.

Once you have obtained an API key, you may provide it as part of the Error Reporting instance configuration:

```js
const errors = require('@google-cloud/error-reporting')({
  projectId: '{your project ID}',
  key: '{your api key}'
});
```

If a key is provided, the module will not attempt to authenticate using the methods associated with locally-stored credentials as mentioned in the previous section.

We recommend using a file, environment variable, or another mechanism to store the API key rather than hard-coding it into your application's source.

**Note:** The Error Reporting instance will check if the provided API key is invalid shortly after it is instantiated. If the key is invalid, an error-level message will be logged to stdout.





[api-key]: https://support.google.com/cloud/answer/6158862
[app-default-credentials]: https://developers.google.com/identity/protocols/application-default-credentials
[express-error-docs]: https://expressjs.com/en/guide/error-handling.html
[gcloud-sdk]: https://cloud.google.com/sdk/gcloud/
[logging-bunyan]: https://www.npmjs.com/package/@google-cloud/logging-bunyan
[logging-winston]: https://www.npmjs.com/package/@google-cloud/logging-winston
[npm-image]: https://badge.fury.io/js/%40google-cloud%2Ferror-reporting.svg
[npm-url]: https://npmjs.org/package/@google-cloud/error-reporting
[service-account]: https://console.developers.google.com/apis/credentials/serviceaccountkey
[snyk-image]: https://snyk.io/test/npm/@google-cloud/error-reporting/badge.svg
[snyk-url]: https://snyk.io/test/npm/@google-cloud/error-reporting
