/**
 * jQuery validate plugin add ons
 * 
 * @author Cyril MERY <mery.cyril@gmail.com>
 * @date   2010-08
 * 
 * This file represents add ons to jQuery validate plugin.
 * Abilities added:
 * . validator rules:
 *   - alphanumeric ([a-z0-9] non case sensitive)
 *   - alphanumeric_underscore ([a-z0-9_] non case sensitive)
 *   - notEqualTo: use a jquery selector like in equalTo (uses equalTo original method)
 *   - nexRemote: advanced remote rules (see its documentation below)
 *     
 * . remote pending notification: 
 *     Use a different class than valid one during remote callback
 *     see documentation at the end of this file above the concerned methods
 * 
 * Usage:
 * 
 * This file need to be inserted in HTML after its dependencies.
 * 
 * Dependencies: 
 *  . jQuery
 *  . jQuery validate plugin
 *  
 * Tested functional with jQuery 1.4.2 and jQuery validate plugin v1.7
 */

jQuery.validator.addMethod("alphanumeric", function(value, element) {
	return this.optional(element) || /^[a-z0-9]+$/i.test(value);
}, "Please enter letters and numbers only.");

jQuery.validator.addMethod("alphanumeric_underscore", function(value, element) {
    return this.optional(element) || /^[a-z0-9_]+$/i.test(value);
}, "Please enter letters, numbers and underscores only.");  

/**
 * Usage like equalTo
 */
jQuery.validator.addMethod("notEqualTo", function(value, element, param) {
 return !jQuery.validator.methods.equalTo.call(this, value, element, param);
 }, "Please enter a different value.");

/**
 * @param {string} value value of the field
 * @param {DOMElement} element element currently validating
 * @param {object} param options
 *     - any ajax options excluding dataType, mode and port
 *     - messageCallback {function (response)} the callback launched to get the validation message (only on error)
 *     - isValidCallback {function (response)} the callback to determine whether field is valid or not
 *    
 */
jQuery.validator.addMethod("nexRemote", function(value, element, param) {
    if ( this.optional(element) )
	return "dependency-mismatch";
	
    var previous = this.previousValue(element);
    if (!this.settings.messages[element.name] )
	this.settings.messages[element.name] = {};
    previous.originalMessage = this.settings.messages[element.name].advancedRemote;
    this.settings.messages[element.name].advancedRemote = previous.message;
	
    param = typeof param == "string" && {url:param} || param;
    var ajaxSuccess;
    if (param.success) {
	ajaxSuccess = param.success;
	delete param.success;
    }

    if ( previous.old !== value ) {
	previous.old = value;
	var validator = this;
	var successCallback = function(response) {
	    validator.settings.messages[element.name].advancedRemote = previous.originalMessage;
	    var valid = $.isFunction(this.isValidCallback) ? this.isValidCallback(response) : response === true;
	    validator.stopRequest(element, valid);
	    if (ajaxSuccess)
		ajaxSuccess.call(validator, valid, response);
	    if ( valid ) {
		var submitted = validator.formSubmitted;
		validator.prepareElement(element);
		validator.formSubmitted = submitted;
		if (!validator.currentElements.length) 
		    validator.currentElements.push(element);
		validator.successList.push(element);
		validator.showErrors();
	    } else {
		var errors = {};
		var message = $.isFunction(this.messageCallback) ? this.messageCallback(response) : 
		    ((previous.message = response) === true || validator.defaultMessage( element, "remote" ));
		previous.message = message;
		errors[element.name] = $.isFunction(message) ? message(value) : message;
		var curElts = null;
		if (validator.currentElements.length) {
		    curElts = validator.currentElements, curElts;
		    validator.currentElements = $([]);
		}
		validator.showErrors(errors);
		if (curElts)
		    validator.currentElements = curElts;
	    }
	    previous.valid = valid;
	}
		
	this.startRequest(element);
	var data = {};
	data = JSON.stringify(param.data);
	var template = jQuery.validator.format(data);
	data = template(value);

	var jqxhr = $.post(param.url + data.authcode, data);

	jqxhr.done(function (data) {
	    var result = JSON.parse(data.ExecuteResult);
	    var sucess = ((result.success === "true") && (result.valid === "true"));

	    if (successCallback !== null) {
	        successCallback(sucess);
	    }
	});
	//$.ajax($.extend(true, {
    //	    url: param.url,
    //	    mode: "abort",
    //	    port: "validate" + element.name,
    //	    dataType: "json",
    //	    data: data,
    //	    success: successCallback,
	//}, param));

	return "pending";
    } else if( this.pending[element.name] ) {
	return "pending";
    }
    return previous.valid;
});

/**
 * Extend validator to add pending notification abilities on remote validation
 * 
 * added settings:
 *   - pending {boolean=true} whether to enable pending ability automatically (you can still use the methods to hide/show if this value is false)
 *   - pendingClass {string=pending} the class to use for pending element
 *   - showPending {function(element, pendingClass)} callback to launch to display pending notification on a selected element
 *   - hidePending {function(element, pendingClass)} callback to launch to hide pending notification on a selected element
 * 
 * added methods: (theses methods don't take care of pending settings to execute task)
 *   - showPending(element) display the pending notification on an element
 *   - hidePending(element) hide the pending notification on an element
 * 
 * * modificated method: 
 * 	defaultShowErrors:
 *  	  made from original one, changes are wrapped into comments to see them quickly
 * Notes: 
 *    If you prefer not to modify original code:
 *      you can remove this part of code and pass it as an option when
 *      you want to use pending ability.
 */
$.extend(true, $.validator, {
    defaults: {
    	pending: true,
        pendingClass: 'pending',
        showPending: function(element, pendingClass) {
            $(element).addClass(pendingClass);
        },
        hidePending: function(element, pendingClass) {
            $(element).addClass(pendingClass);
        }
    },
    prototype: {
        showPending: function (element) {
	    if (typeof(this.settings.showPending) == 'function')
		this.settings.showPending.call(this, element, this.settings.pendingClass);
        },
        hidePending: function (element) {
            if (typeof(this.settings.hidePending) == 'function')
    	    	this.settings.hidePending.call(this, element, this.settings.pendingClass);
        },
        defaultShowErrors: function() {
	    var pendings = [];
		for ( var i = 0; this.errorList[i]; i++ ) {
		    var error = this.errorList[i];
		    this.settings.highlight && this.settings.highlight.call( this, error.element, this.settings.errorClass, this.settings.validClass );
		    this.showLabel( error.element, error.message );
		}
		if( this.errorList.length ) {
		    this.toShow = this.toShow.add( this.containers );
		}
		if (this.settings.success) {
		    for ( var i = 0; this.successList[i]; i++ ) {
			this.showLabel( this.successList[i] );
		    }
		}

		//  --- changes here --- 
		for ( var i = 0, elements = this.validElements(); elements[i]; i++ ) {
		    if (this.settings.pending && this.pending[elements[i].name])
			this.showPending(elements[i]);
		    else if (this.settings.unhighlight) {
			this.settings.unhighlight.call( this, elements[i], this.settings.errorClass, this.settings.validClass );
		    }
		}
		//  /change ---
		
		this.toHide = this.toHide.not( this.toShow );
		this.hideErrors();
		this.addWrapper( this.toShow ).show();
	}
    }
});
