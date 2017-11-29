'use strict';

var AuthorizeNet = {} ;

AuthorizeNet.init = function() {
    console.log('AuthorizeNet.init');
};

AuthorizeNet.ChargeCreditCard = function (params,callback) {
	var res        = {} 
	  , production = 1
	;

	if(params){

		var merchantAuthenticationType = new AUTHORIZENET.ApiContracts.MerchantAuthenticationType();
		if(production){
			merchantAuthenticationType.setName(AUTHORIZENET.constants.apiLoginKey);
			merchantAuthenticationType.setTransactionKey(AUTHORIZENET.constants.transactionKey);
		} else {
			merchantAuthenticationType.setName(AUTHORIZENET.constants.apiLoginKeyDev);
			merchantAuthenticationType.setTransactionKey(AUTHORIZENET.constants.transactionKeyDev);
		}

		var creditCard = new AUTHORIZENET.ApiContracts.CreditCardType();
		creditCard.setCardNumber(params.ccn);
		creditCard.setExpirationDate(params.exp);
		creditCard.setCardCode(params.ccv);

		var paymentType = new AUTHORIZENET.ApiContracts.PaymentType();
		paymentType.setCreditCard(creditCard);

		params.first = '' ;
		params.last = '' ;
		var noc = [] ;
		if(params.noc){
			noc = params.noc.toString().replace(/\+/g,' ').split(' ') ;
			if(noc.length>0){
				params.first = noc[0] ;
				params.last = noc[noc.length-1] ;
			}
		}
		if(params.address){
			params.address = params.address.toString().replace(/\+/g,' ') ;
		}
		if(params.state){
			params.state = params.state.toString().replace(/\+/g,' ') ;
		}
		if(params.zip){
			params.zip = params.zip.toString().replace(/\+/g,' ') ;
		}

		var billTo = new AUTHORIZENET.ApiContracts.CustomerAddressType();
		billTo.setFirstName(params.last);
		billTo.setLastName(params.first);
		// billTo.setCompany('');
		billTo.setAddress(params.address);
		// billTo.setCity('');
		billTo.setState(params.state);
		billTo.setZip(params.zip);
		billTo.setCountry('USA');

		var transactionRequestType = new AUTHORIZENET.ApiContracts.TransactionRequestType();
		transactionRequestType.setTransactionType(AUTHORIZENET.ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
		transactionRequestType.setPayment(paymentType);
		transactionRequestType.setAmount(params.amt);
		transactionRequestType.setBillTo(billTo);

		var createRequest = new AUTHORIZENET.ApiContracts.CreateTransactionRequest();
		createRequest.setMerchantAuthentication(merchantAuthenticationType);
		createRequest.setTransactionRequest(transactionRequestType);

		var ctrl = new AUTHORIZENET.ApiControllers.CreateTransactionController(createRequest.getJSON());

		// For PRODUCTION use
		// ctrl.setEnvironment(SDKConstants.endpoint.production);
		if(production){
			ctrl.setEnvironment(AUTHORIZENET.constants.endpointProduction);
			// console.log('AuthNet Production Attempt for $'+parseFloat(params.amt).toFixed(2));
		} else {
			console.log('AuthNet Sandbox Attempt for $'+parseFloat(params.amt).toFixed(2)+', apiLoginKey: '+AUTHORIZENET.constants.apiLoginKey+', transactionKey: '+AUTHORIZENET.constants.transactionKey);
		}

		ctrl.execute(function(){

			var apiResponse = ctrl.getResponse();

			var response = new AUTHORIZENET.ApiContracts.CreateTransactionResponse(apiResponse);

			if(response != null){
				if(response.getMessages().getResultCode() == AUTHORIZENET.ApiContracts.MessageTypeEnum.OK && 
					response.getTransactionResponse().getResponseCode() == '1'){
					res = response.getTransactionResponse() ;
					res.amt = params.amt ;
				} else {
					res.error = response.getMessages().getMessage()[0].getText();
				}
			} else{
				res.error = 'no response from payment gateway' ;
			}
			callback(res);
		});
	}
};

AuthorizeNet.RefundCreditCard = function (params,callback) {
	var res        = {} 
	  , production = 1
	;
	if(params){
		var merchantAuthenticationType = new AUTHORIZENET.ApiContracts.MerchantAuthenticationType();
		if(production){
			merchantAuthenticationType.setName(AUTHORIZENET.constants.apiLoginKey);
			merchantAuthenticationType.setTransactionKey(AUTHORIZENET.constants.transactionKey);
		} else {
			merchantAuthenticationType.setName(AUTHORIZENET.constants.apiLoginKeyDev);
			merchantAuthenticationType.setTransactionKey(AUTHORIZENET.constants.transactionKeyDev);
		}
		var creditCard = new AUTHORIZENET.ApiContracts.CreditCardType();
		creditCard.setCardNumber(params.last_four);
		creditCard.setExpirationDate(params.exp_date);
		var paymentType = new AUTHORIZENET.ApiContracts.PaymentType();
		paymentType.setCreditCard(creditCard);
		var transactionRequestType = new AUTHORIZENET.ApiContracts.TransactionRequestType();
		transactionRequestType.setTransactionType(AUTHORIZENET.ApiContracts.TransactionTypeEnum.REFUNDTRANSACTION);
		transactionRequestType.setAmount(params.amt);
		transactionRequestType.setRefTransId(params.transaction_id);
		transactionRequestType.setPayment(paymentType);
		var createRequest = new AUTHORIZENET.ApiContracts.CreateTransactionRequest();
		createRequest.setMerchantAuthentication(merchantAuthenticationType);
		createRequest.setTransactionRequest(transactionRequestType);
		var ctrl = new AUTHORIZENET.ApiControllers.CreateTransactionController(createRequest.getJSON());
		// For PRODUCTION use
		// ctrl.setEnvironment(SDKConstants.endpoint.production);
		if(production){
			ctrl.setEnvironment(AUTHORIZENET.constants.endpointProduction);
		} else {
			console.log('AuthNet Sandbox Attempt for $'+parseFloat(params.amt).toFixed(2)+', apiLoginKey: '+AUTHORIZENET.constants.apiLoginKey+', transactionKey: '+AUTHORIZENET.constants.transactionKey);
		}
		ctrl.execute(function(){
		  var apiResponse = ctrl.getResponse();

		  var response = new AUTHORIZENET.ApiContracts.CreateTransactionResponse(apiResponse);

		  if(response != null){
			  if(response.getMessages().getResultCode() == AUTHORIZENET.ApiContracts.MessageTypeEnum.OK && 
				  response.getTransactionResponse().getResponseCode() == '1'){
				  res = response.getTransactionResponse() ;
				  res.amt = params.amt ;
			  } else {
				  res = response.getTransactionResponse() ;
				  res.error = response.getMessages().getMessage()[0].getText();
			  }
		  } else{
			  res.error = 'no response from payment gateway' ;
		  }
		  callback(res);
		});
	}
};

global.AuthorizeNet = AuthorizeNet ;
