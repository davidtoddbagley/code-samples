'use strict';

var DocuSign = {} ;

DocuSign.init = function() {
    console.log('DocuSign.init');
};

DocuSign.Agreement = function (agreement,data,callback) {

    var docusign_email = "[email address here]"                 // your account email
      , docusign_name = "[full name here]"                      // your account name
      , docusign_password = "[api password string here]"        // production
      , integratorKey = "[api integrator key here]"             // your account Integrator Key (found on Preferences -> API page)
      , recipientName = data.name.toString().toUpperCase()      // recipient (signer) name
      , templateId = ""                                         // provide valid templateId from a template in your account
      , templateRoleName = "LicenseHolder"                      // template role that exists on template referenced above
      , baseUrl = ""                                            // we will retrieve this
      , envelopeId = ""                                         // created from step 2
    ;

    if(!(data.suite)){
      data.suite = ' ' ;
    }

    switch(agreement){
      //
      case            'ach' : templateId = '[document id string here]' ;   // sandbox
                              templateId = '[document id string here]' ;   // production
                              break;
      //
                    default : templateId = '[document id string here]' ;   // sandbox
                              templateId = '[document id string here]' ;   // production
      //
    }

    ASYNC.waterfall(
    [
      //////////////////////////////////////////////////////////////////////
      // Step 1 - Login (used to retrieve accountId and baseUrl)
      //////////////////////////////////////////////////////////////////////
      function(next) {
        // var url = "https://demo.docusign.net/restapi/v2/login_information";  // sandbox
        var url = "https://www.docusign.net/restapi/v2/login_information";      // production
        var body = "";  // no request body for login api call
        
        // set request url, method, body, and headers
        var options = initializeRequest(url, "GET", body, docusign_email, docusign_password);
        
        // send the request...
        REQUEST(options, function(err, res, body) {
          if(!parseResponseBody(err, res, body)) {
            return;
          }
          baseUrl = JSON.parse(body).loginAccounts[0].baseUrl;
          next(null); // call next function
        });
      },
      
      //////////////////////////////////////////////////////////////////////
      // Step 2 - Send envelope with one Embedded recipient (using clientUserId property)
      //////////////////////////////////////////////////////////////////////
      function(next) {
        var url = baseUrl + "/envelopes";
        var body = JSON.stringify({
            "emailSubject": "DocuSign API call - Embedded Sending Example",
            "templateId": templateId,
            "templateRoles": [{
              //
              "email": data.email.toString().toUpperCase(),
              "name": recipientName,
              //
              "userName": docusign_name,
              //
              "tabs" : {
                "textTabs" : [ 
                              {
                                 "tabLabel" : "\\*signer_company"
                                ,   "value" : data.legal.toString().toUpperCase()
                              },
                              {
                                 "tabLabel" : "\\*signer_name"
                                ,   "value" : data.name.toString().toUpperCase()
                              },
                              {
                                 "tabLabel" : "\\*signer_title"
                                ,   "value" : templateRoleName.toString().toUpperCase()
                              },
                              {
                                 "tabLabel" : "\\*signer_email"
                                ,   "value" : data.email.toString().toUpperCase()
                              },
                              {
                                 "tabLabel" : "\\*signer_city"
                                ,   "value" : data.city.toString().toUpperCase()+', '+data.state.toString().toUpperCase()+'  '+data.postalcode.toString().toUpperCase()
                              },
                              {
                                 "tabLabel" : "\\*signer_phone"
                                ,   "value" : data.phone.toString().toUpperCase()
                              },
                              {
                                 "tabLabel" : "\\*signer_postalcode"
                                ,   "value" : data.postalcode.toString().toUpperCase()
                              },
                              {
                                 "tabLabel" : "\\*signer_state"
                                ,   "value" : data.state.toString().toUpperCase()
                              },
                              {
                                 "tabLabel" : "\\*signer_street"
                                ,   "value" : data.street.toString().toUpperCase()
                              },
                              {
                                 "tabLabel" : "\\*signer_suite"
                                ,   "value" : data.suite.toString().toUpperCase()
                              } 
                ]
              },
              //
              "roleName": templateRoleName,
              "clientUserId": data.piqcode_id
              //
            }],
            "status": "sent"
          });

        // set request url, method, body, and headers
        var options = initializeRequest(url, "POST", body, docusign_email, docusign_password);
        
        // send the request...
        REQUEST(options, function(err, res, body) {
          if(!parseResponseBody(err, res, body)) {
            return;
          }
          // parse the envelopeId value from the response
          envelopeId = JSON.parse(body).envelopeId;
          next(null); // call next function
        });
      },
      
      //////////////////////////////////////////////////////////////////////
      // Step 3 - Get the Embedded Signing View (aka the recipient view)
      //////////////////////////////////////////////////////////////////////
      function(next) {
        var url = baseUrl + "/envelopes/" + envelopeId + "/views/recipient";
        var method = "POST";
        var body = JSON.stringify({
            "returnUrl": "http://[url string here]",
            "authenticationMethod": "email",          
            "email": data.email.toString().toUpperCase(),
            "name": recipientName,
            "userName": docusign_name,
            "clientUserId": data.piqcode_id
          });  
        
        // set request url, method, body, and headers
        var options = initializeRequest(url, "POST", body, docusign_email, docusign_password);
        
        // send the request...
        REQUEST(options, function(err, res, body) {
          if(!parseResponseBody(err, res, body))
            return;
          else
            if(body){
              // console.log(body);
              // console.log(JSON.parse(body).url);
              callback(JSON.parse(body).url);
            }
            // console.log("\nNavigate to the above URL to start the Embedded Signing workflow...");
        });
      }
    ]);

    //***********************************************************************************************
    // --- HELPER FUNCTIONS ---
    //***********************************************************************************************
    function initializeRequest(url, method, body, email, password) {  
      var options = {
        "method": method,
        "uri": url,
        "body": body,
        "headers": {}
      };
      addRequestHeaders(options, email, password);
      return options;
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////
    function addRequestHeaders(options, email, password) {  
      // JSON formatted authentication header (XML format allowed as well)
      var dsAuthHeader = JSON.stringify({
        "Username": email,
        "Password": password, 
        "IntegratorKey": integratorKey  // global
      });
      // DocuSign authorization header
      options.headers["X-DocuSign-Authentication"] = dsAuthHeader;
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////
    function parseResponseBody(err, res, body) {
      // console.log("\r\nAPI Call Result: \r\n", JSON.parse(body));
      if( res.statusCode != 200 && res.statusCode != 201) { // success statuses
        // console.log("Error calling webservice, status is: ", res.statusCode);
        // console.log("\r\n", err);
        return false;
      }
      return true;
    }

};

global.DocuSign = DocuSign ;
