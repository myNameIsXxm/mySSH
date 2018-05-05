(function($) {
	var PROP_NAME = 'datepicker';
	var target_id_suf=1;
	function Datepicker() {
		this.debug = false;
		this._curInst = null;
		this._disabledInputs = [];
		this._datepickerShowing = false;
		this._inDialog = false;
		this._mainDivId = 'ui-datepicker-div';
		this._appendClass = 'ui-datepicker-append';
		this._triggerClass = 'ui-datepicker-trigger';
		this._dialogClass = 'ui-datepicker-dialog';
		this._promptClass = 'ui-datepicker-prompt';
		this._unselectableClass = 'ui-datepicker-unselectable';
		this._currentClass = 'ui-datepicker-current-day';
		this.regional = [];
		this.regional[''] = {
			clearText : '清除',
			clearStatus : '清除当前日期',
			closeText : '关闭',
			closeStatus : '关闭此日历',
			prevText : '&#x3c;上月',
			prevStatus : '显示上一月',
			nextText : '下月&#x3e;',
			nextStatus : '显示下一月',
			currentText : '今天',
			currentStatus : '显示本月日历',
			monthNames : [ '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月',
					'九月', '十月', '十一月', '十二月' ],
			monthNamesShort : [ '1', '2', '3', '4', '5', '6', '7', '8', '9',
					'10', '11', '12' ],
			monthStatus : '显示不同月份',
			yearStatus : '显示不同年份',
			weekHeader : 'Wk',
			weekStatus : 'Week of the year',
			dayNames : [ '周日', '周一', '周二', '周三', '周四', '周五', '周六' ],
			dayNamesShort : [ '星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六' ],
			dayNamesMin : [ '日', '一', '二', '三', '四', '五', '六' ],
			dayStatus : 'Set DD as first week day',
			dateStatus : 'Select DD, M d',
			dateFormat : 'mm/dd/yy',
			firstDay : 0,
			initStatus : 'Select a date',
			isRTL : false
		};
		this._defaults = {
			showOn : 'focus',
			showAnim : 'show',
			showOptions : {},
			defaultDate : null,
			appendText : '',
			buttonText : '...',
			buttonImage : '',
			buttonImageOnly : false,
			closeAtTop : true,
			mandatory : false,
			hideIfNoPrevNext : false,
			navigationAsDateFormat : false,
			gotoCurrent : false,
			changeMonth : true,
			changeYear : true,
			yearRange : '-10:+10',
			changeFirstDay : true,
			highlightWeek : false,
			showOtherMonths : false,
			showWeeks : false,
			calculateWeek : this.iso8601Week,
			shortYearCutoff : '+10',
			showStatus : false,
			statusForDate : this.dateStatus,
			minDate : null,
			maxDate : null,
			duration : 'normal',
			beforeShowDay : null,
			beforeShow : null,
			onSelect : null,
			onChangeMonthYear : null,
			onClose : null,
			numberOfMonths : 1,
			stepMonths : 1,
			rangeSelect : false,
			rangeSeparator : ' - ',
			altField : '',
			altFormat : ''
		};
		$.extend(this._defaults, this.regional['']);
		this.dpDiv = $('<div id="' + this._mainDivId + '" style="display: none;"></div>');
	}
	$
			.extend(
					Datepicker.prototype,
					{
						markerClassName : 'hasDatepicker',
						log : function() {
							if (this.debug)
								console.log.apply('', arguments);
						},
						setDefaults : function(settings) {
							extendRemove(this._defaults, settings || {});
							return this;
						},
						
						_attachDatepicker : function(target, settings) {
							var inlineSettings = null;
							target_id_suf=target_id_suf+1;
							
							for (attrName in this._defaults) {
							    
								var attrValue = target
										.getAttribute('date:' + attrName);
								
								if (attrValue) {
									inlineSettings = inlineSettings || {};
									try {
										inlineSettings[attrName] = eval(attrValue);
									} catch (err) {
										inlineSettings[attrName] = attrValue;
									}
								}
							}
							var nodeName = target.nodeName.toLowerCase();
							var inline = (nodeName == 'div' || nodeName == 'span');
							if (!target.id)
								target.id = 'dp' + new Date().getTime()+target_id_suf;
							var inst = this._newInst($(target), inline);
							inst.settings = $.extend( {}, settings || {},
									inlineSettings || {});
							if (nodeName == 'input') {
								this._connectDatepicker(target, inst);
							} else if (inline) {
								this._inlineDatepicker(target, inst);
							}
						},
						_newInst : function(target, inline) {
							return {
								id : target[0].id,
								input : target,
								selectedDay : 0,
								selectedMonth : 0,
								selectedYear : 0,
								drawMonth : 0,
								drawYear : 0,
								inline : inline,
								dpDiv : (!inline ? this.dpDiv
										: $('<div class="ui-datepicker-inline"></div>'))
							};
						},
						_connectDatepicker : function(target, inst) {
							var input = $(target);
							if (input.hasClass(this.markerClassName))
								return;
							var appendText = this._get(inst, 'appendText');
							var isRTL = this._get(inst, 'isRTL');
							if (appendText)
								input[isRTL ? 'before' : 'after']
										('<span class="' + this._appendClass
												+ '">' + appendText + '</span>');
							var showOn = this._get(inst, 'showOn');
							if (showOn == 'focus' || showOn == 'both')
								input.focus(this._showDatepicker);
							if (showOn == 'button' || showOn == 'both') {
								var buttonText = this._get(inst, 'buttonText');
								var buttonImage = this
										._get(inst, 'buttonImage');
								var trigger = $(this._get(inst,
										'buttonImageOnly') ? $('<img/>')
										.addClass(this._triggerClass).attr( {
											src : buttonImage,
											alt : buttonText,
											title : buttonText
										}) : $(
										'<button type="button"></button>')
										.addClass(this._triggerClass).html(
												buttonImage == '' ? buttonText
														: $('<img/>').attr( {
															src : buttonImage,
															alt : buttonText,
															title : buttonText
														})));
								input[isRTL ? 'before' : 'after'](trigger);
								trigger
										.click(function() {
											if ($.datepicker._datepickerShowing
													&& $.datepicker._lastInput == target)
												$.datepicker._hideDatepicker();
											else
												$.datepicker
														._showDatepicker(target);
											return false;
										});
							}
							input.addClass(this.markerClassName).keydown(
									this._doKeyDown).keypress(this._doKeyPress)
									.bind("setData.datepicker",
											function(event, key, value) {
												inst.settings[key] = value;
											}).bind("getData.datepicker",
											function(event, key) {
												return this._get(inst, key);
											});
							$.data(target, PROP_NAME, inst);
						},
						_inlineDatepicker : function(target, inst) {
							var input = $(target);
							if (input.hasClass(this.markerClassName))
								return;
							input.addClass(this.markerClassName).append(
									inst.dpDiv).bind("setData.datepicker",
									function(event, key, value) {
										inst.settings[key] = value;
									}).bind("getData.datepicker",
									function(event, key) {
										return this._get(inst, key);
									});
							$.data(target, PROP_NAME, inst);
							this._setDate(inst, this._getDefaultDate(inst));
							this._updateDatepicker(inst);
						},
						_inlineShow : function(inst) {
							var numMonths = this._getNumberOfMonths(inst);
							inst.dpDiv.width(numMonths[1]
									* $('.ui-datepicker', inst.dpDiv[0])
											.width());
						},
						_dialogDatepicker : function(input, dateText, onSelect,
								settings, pos) {
							var inst = this._dialogInst;
							if (!inst) {
								var id = 'dp' + new Date().getTime();
								this._dialogInput = $('<input type="text" id="' + id + '" size="1" style="position: absolute; top: -100px;"/>');
								this._dialogInput.keydown(this._doKeyDown);
								$('body').append(this._dialogInput);
								inst = this._dialogInst = this._newInst(
										this._dialogInput, false);
								inst.settings = {};
								$.data(this._dialogInput[0], PROP_NAME, inst);
							}
							extendRemove(inst.settings, settings || {});
							this._dialogInput.val(dateText);
							this._pos = (pos ? (pos.length ? pos : [ pos.pageX,
									pos.pageY ]) : null);
							if (!this._pos) {
								var browserWidth = window.innerWidth
										|| document.documentElement.clientWidth
										|| document.body.clientWidth;
								var browserHeight = window.innerHeight
										|| document.documentElement.clientHeight
										|| document.body.clientHeight;
								var scrollX = document.documentElement.scrollLeft
										|| document.body.scrollLeft;
								var scrollY = document.documentElement.scrollTop
										|| document.body.scrollTop;
								this._pos = [
										(browserWidth / 2) - 100 + scrollX,
										(browserHeight / 2) - 150 + scrollY ];
							}
							this._dialogInput.css('left', this._pos[0] + 'px')
									.css('top', this._pos[1] + 'px');
							inst.settings.onSelect = onSelect;
							this._inDialog = true;
							this.dpDiv.addClass(this._dialogClass);
							this._showDatepicker(this._dialogInput[0]);
							if ($.blockUI)
								$.blockUI(this.dpDiv);
							$.data(this._dialogInput[0], PROP_NAME, inst);
							return this;
						},
						_destroyDatepicker : function(target) {
							var nodeName = target.nodeName.toLowerCase();
							var $target = $(target);
							$.removeData(target, PROP_NAME);
							if (nodeName == 'input') {
								$target.siblings('.' + this._appendClass)
										.remove().end().siblings(
												'.' + this._triggerClass)
										.remove().end().removeClass(
												this.markerClassName).unbind(
												'focus', this._showDatepicker)
										.unbind('keydown', this._doKeyDown)
										.unbind('keypress', this._doKeyPress);
							} else if (nodeName == 'div' || nodeName == 'span')
								$target.removeClass(this.markerClassName)
										.empty();
						},
						_enableDatepicker : function(target) {
							target.disabled = false;
							$(target).siblings('button.' + this._triggerClass)
									.each(function() {
										this.disabled = false;
									}).end().siblings(
											'img.' + this._triggerClass).css( {
										opacity : '1.0',
										cursor : ''
									});
							this._disabledInputs = $
									.map(this._disabledInputs,
											function(value) {
												return (value == target ? null
														: value);
											});
						},
						_disableDatepicker : function(target) {
							target.disabled = true;
							$(target).siblings('button.' + this._triggerClass)
									.each(function() {
										this.disabled = true;
									}).end().siblings(
											'img.' + this._triggerClass).css( {
										opacity : '0.5',
										cursor : 'default'
									});
							this._disabledInputs = $
									.map(this._disabledInputs,
											function(value) {
												return (value == target ? null
														: value);
											});
							this._disabledInputs[this._disabledInputs.length] = target;
						},
						_isDisabledDatepicker : function(target) {
							if (!target)
								return false;
							for ( var i = 0; i < this._disabledInputs.length; i++) {
								if (this._disabledInputs[i] == target)
									return true;
							}
							return false;
						},
						_changeDatepicker : function(target, name, value) {
							var settings = name || {};
							if (typeof name == 'string') {
								settings = {};
								settings[name] = value;
							}
							if (inst = $.data(target, PROP_NAME)) {
								extendRemove(inst.settings, settings);
								this._updateDatepicker(inst);
							}
						},
						_setDateDatepicker : function(target, date, endDate) {
							var inst = $.data(target, PROP_NAME);
							if (inst) {
								this._setDate(inst, date, endDate);
								this._updateDatepicker(inst);
							}
						},
						_getDateDatepicker : function(target) {
							var inst = $.data(target, PROP_NAME);
							if (inst)
								this._setDateFromField(inst);
							return (inst ? this._getDate(inst) : null);
						},
						_doKeyDown : function(e) {
							var inst = $.data(e.target, PROP_NAME);
							var handled = true;
							if ($.datepicker._datepickerShowing)
								switch (e.keyCode) {
								case 9:
									$.datepicker._hideDatepicker(null, '');
									break;
								case 13:
									$.datepicker
											._selectDay(
													e.target,
													inst.selectedMonth,
													inst.selectedYear,
													$(
															'td.ui-datepicker-days-cell-over',
															inst.dpDiv)[0]);
									return false;
									break;
								case 27:
									$.datepicker
											._hideDatepicker(null, $.datepicker
													._get(inst, 'duration'));
									break;
								case 33:
									$.datepicker._adjustDate(e.target,
											(e.ctrlKey ? -1 : -$.datepicker
													._get(inst, 'stepMonths')),
											(e.ctrlKey ? 'Y' : 'M'));
									break;
								case 34:
									$.datepicker._adjustDate(e.target,
											(e.ctrlKey ? +1 : +$.datepicker
													._get(inst, 'stepMonths')),
											(e.ctrlKey ? 'Y' : 'M'));
									break;
								case 35:
									if (e.ctrlKey)
										$.datepicker._clearDate(e.target);
									break;
								case 36:
									if (e.ctrlKey)
										$.datepicker._gotoToday(e.target);
									break;
								case 37:
									if (e.ctrlKey)
										$.datepicker._adjustDate(e.target, -1,
												'D');
									break;
								case 38:
									if (e.ctrlKey)
										$.datepicker._adjustDate(e.target, -7,
												'D');
									break;
								case 39:
									if (e.ctrlKey)
										$.datepicker._adjustDate(e.target, +1,
												'D');
									break;
								case 40:
									if (e.ctrlKey)
										$.datepicker._adjustDate(e.target, +7,
												'D');
									break;
								default:
									handled = false;
								}
							else if (e.keyCode == 36 && e.ctrlKey)
								$.datepicker._showDatepicker(this);
							else
								handled = false;
							if (handled) {
								e.preventDefault();
								e.stopPropagation();
							}
						},
						_doKeyPress : function(e) {
							var inst = $.data(e.target, PROP_NAME);
							var chars = $.datepicker
									._possibleChars($.datepicker._get(inst,
											'dateFormat'));
							var chr = String
									.fromCharCode(e.charCode == undefined ? e.keyCode
											: e.charCode);
							return e.ctrlKey
									|| (chr < ' ' || !chars || chars
											.indexOf(chr) > -1);
						},
						_showDatepicker : function(input) {
							input = input.target || input;
							if (input.nodeName.toLowerCase() != 'input')
								input = $('input', input.parentNode)[0];
							if ($.datepicker._isDisabledDatepicker(input)
									|| $.datepicker._lastInput == input)
								return;
							var inst = $.data(input, PROP_NAME);
							var beforeShow = $.datepicker._get(inst,
									'beforeShow');
							extendRemove(inst.settings,
									(beforeShow ? beforeShow.apply(input, [
											input, inst ]) : {}));
							$.datepicker._hideDatepicker(null, '');
							$.datepicker._lastInput = input;
							$.datepicker._setDateFromField(inst);
							if ($.datepicker._inDialog)
								input.value = '';
							if (!$.datepicker._pos) {
								$.datepicker._pos = $.datepicker
										._findPos(input);
								$.datepicker._pos[1] += input.offsetHeight;
							}
							var isFixed = false;
							$(input).parents().each(function() {
								isFixed |= $(this).css('position') == 'fixed';
								return !isFixed;
							});
							if (isFixed && $.browser.opera) {
								$.datepicker._pos[0] -= document.documentElement.scrollLeft;
								$.datepicker._pos[1] -= document.documentElement.scrollTop;
							}
							var offset = {
								left : $.datepicker._pos[0],
								top : $.datepicker._pos[1]
							};
							$.datepicker._pos = null;
							inst.rangeStart = null;
							inst.dpDiv.css( {
								position : 'absolute',
								display : 'block',
								top : '-1000px'
							});
							$.datepicker._updateDatepicker(inst);
							inst.dpDiv
									.width($.datepicker
											._getNumberOfMonths(inst)[1]
											* $('.ui-datepicker', inst.dpDiv[0])[0].offsetWidth);
							offset = $.datepicker._checkOffset(inst, offset,
									isFixed);
							inst.dpDiv
									.css( {
										position : ($.datepicker._inDialog
												&& $.blockUI ? 'static'
												: (isFixed ? 'fixed'
														: 'absolute')),
										display : 'none',
										left : offset.left + 'px',
										top : offset.top + 'px'
									});
							if (!inst.inline) {
								var showAnim = $.datepicker._get(inst,
										'showAnim') || 'show';
								var duration = $.datepicker._get(inst,
										'duration');
								var postProcess = function() {
									$.datepicker._datepickerShowing = true;
									if ($.browser.msie
											&& parseInt($.browser.version) < 7)
										$('iframe.ui-datepicker-cover').css( {
											width : inst.dpDiv.width() + 4,
											height : inst.dpDiv.height() + 4
										});
								};
								if ($.effects && $.effects[showAnim])
									inst.dpDiv.show(showAnim, $.datepicker
											._get(inst, 'showOptions'),
											duration, postProcess);
								else
									inst.dpDiv[showAnim](duration, postProcess);
								if (duration == '')
									postProcess();
								if (inst.input[0].type != 'hidden')
									inst.input[0].focus();
								$.datepicker._curInst = inst;
							}
						},
						_updateDatepicker : function(inst) {
							var dims = {
								width : inst.dpDiv.width() + 4,
								height : inst.dpDiv.height() + 4
							};
							inst.dpDiv.empty().append(
									this._generateDatepicker(inst)).find(
									'iframe.ui-datepicker-cover').css( {
								width : dims.width,
								height : dims.height
							});
							var numMonths = this._getNumberOfMonths(inst);
							inst.dpDiv[(numMonths[0] != 1 || numMonths[1] != 1 ? 'add'
									: 'remove') + 'Class']
									('ui-datepicker-multi');
							inst.dpDiv[(this._get(inst, 'isRTL') ? 'add'
									: 'remove') + 'Class']('ui-datepicker-rtl');
							if (inst.input && inst.input[0].type != 'hidden')
								$(inst.input[0]).focus();
						},
						_checkOffset : function(inst, offset, isFixed) {
							var pos = inst.input ? this._findPos(inst.input[0])
									: null;
							var browserWidth = window.innerWidth
									|| document.documentElement.clientWidth;
							var browserHeight = window.innerHeight
									|| document.documentElement.clientHeight;
							var scrollX = document.documentElement.scrollLeft
									|| document.body.scrollLeft;
							var scrollY = document.documentElement.scrollTop
									|| document.body.scrollTop;
							if (this._get(inst, 'isRTL')
									|| (offset.left + inst.dpDiv.width() - scrollX) > browserWidth)
								offset.left = Math
										.max(
												(isFixed ? 0 : scrollX),
												pos[0]
														+ (inst.input ? inst.input
																.width()
																: 0)
														- (isFixed ? scrollX
																: 0)
														- inst.dpDiv.width()
														- (isFixed
																&& $.browser.opera ? document.documentElement.scrollLeft
																: 0));
							else
								offset.left -= (isFixed ? scrollX : 0);
							if ((offset.top + inst.dpDiv.height() - scrollY) > browserHeight)
								offset.top = Math
										.max(
												(isFixed ? 0 : scrollY),
												pos[1]
														- (isFixed ? scrollY
																: 0)
														- (this._inDialog ? 0
																: inst.dpDiv
																		.height())
														- (isFixed
																&& $.browser.opera ? document.documentElement.scrollTop
																: 0));
							else
								offset.top -= (isFixed ? scrollY : 0);
							return offset;
						},
						_findPos : function(obj) {
							while (obj
									&& (obj.type == 'hidden' || obj.nodeType != 1)) {
								obj = obj.nextSibling;
							}
							var position = $(obj).offset();
							return [ position.left, position.top ];
						},
						_hideDatepicker : function(input, duration) {
							var inst = this._curInst;
							if (!inst)
								return;
							var rangeSelect = this._get(inst, 'rangeSelect');
							if (rangeSelect && this._stayOpen)
								this._selectDate('#' + inst.id, this
										._formatDate(inst, inst.currentDay,
												inst.currentMonth,
												inst.currentYear));
							this._stayOpen = false;
							if (this._datepickerShowing) {
								duration = (duration != null ? duration : this
										._get(inst, 'duration'));
								var showAnim = this._get(inst, 'showAnim');
								var postProcess = function() {
									$.datepicker._tidyDialog(inst);
								};
								if (duration != '' && $.effects
										&& $.effects[showAnim])
									inst.dpDiv.hide(showAnim, $.datepicker
											._get(inst, 'showOptions'),
											duration, postProcess);
								else
									inst.dpDiv[(duration == '' ? 'hide'
											: (showAnim == 'slideDown' ? 'slideUp'
													: (showAnim == 'fadeIn' ? 'fadeOut'
															: 'hide')))](
											duration, postProcess);
								if (duration == '')
									this._tidyDialog(inst);
								var onClose = this._get(inst, 'onClose');
								if (onClose)
									onClose.apply((inst.input ? inst.input[0]
											: null), [ this._getDate(inst),
											inst ]);
								this._datepickerShowing = false;
								this._lastInput = null;
								inst.settings.prompt = null;
								if (this._inDialog) {
									this._dialogInput.css( {
										position : 'absolute',
										left : '0',
										top : '-100px'
									});
									if ($.blockUI) {
										$.unblockUI();
										$('body').append(this.dpDiv);
									}
								}
								this._inDialog = false;
							}
							this._curInst = null;
						},
						_tidyDialog : function(inst) {
							inst.dpDiv.removeClass(this._dialogClass).unbind(
									'.ui-datepicker');
							$('.' + this._promptClass, inst.dpDiv).remove();
						},
						_checkExternalClick : function(event) {
							if (!$.datepicker._curInst)
								return;
							var $target = $(event.target);
							if (($target.parents('#' + $.datepicker._mainDivId).length == 0)
									&& !$target
											.hasClass($.datepicker.markerClassName)
									&& !$target
											.hasClass($.datepicker._triggerClass)
									&& $.datepicker._datepickerShowing
									&& !($.datepicker._inDialog && $.blockUI))
								$.datepicker._hideDatepicker(null, '');
						},
						_adjustDate : function(id, offset, period) {
							var target = $(id);
							var inst = $.data(target[0], PROP_NAME);
							this._adjustInstDate(inst, offset, period);
							this._updateDatepicker(inst);
						},
						_gotoToday : function(id) {
							var target = $(id);
							var inst = $.data(target[0], PROP_NAME);
							if (this._get(inst, 'gotoCurrent')
									&& inst.currentDay) {
								inst.selectedDay = inst.currentDay;
								inst.drawMonth = inst.selectedMonth = inst.currentMonth;
								inst.drawYear = inst.selectedYear = inst.currentYear;
							} else {
								var date = new Date();
								inst.selectedDay = date.getDate();
								inst.drawMonth = inst.selectedMonth = date
										.getMonth();
								inst.drawYear = inst.selectedYear = date
										.getFullYear();
							}
							this._adjustDate(target);
							this._notifyChange(inst);
						},
						_selectMonthYear : function(id, select, period) {
							var target = $(id);
							var inst = $.data(target[0], PROP_NAME);
							inst._selectingMonthYear = false;
							inst[period == 'M' ? 'drawMonth' : 'drawYear'] = select.options[select.selectedIndex].value - 0;
							this._adjustDate(target);
							this._notifyChange(inst);
						},
						_clickMonthYear : function(id) {
							var target = $(id);
							var inst = $.data(target[0], PROP_NAME);
							if (inst.input && inst._selectingMonthYear
									&& !$.browser.msie)
								inst.input[0].focus();
							inst._selectingMonthYear = !inst._selectingMonthYear;
						},
						_changeFirstDay : function(id, day) {
							var target = $(id);
							var inst = $.data(target[0], PROP_NAME);
							inst.settings.firstDay = day;
							this._updateDatepicker(inst);
						},
						_selectDay : function(id, month, year, td) {
							if ($(td).hasClass(this._unselectableClass))
								return;
							var target = $(id);
							var inst = $.data(target[0], PROP_NAME);
							var rangeSelect = this._get(inst, 'rangeSelect');
							if (rangeSelect) {
								this._stayOpen = !this._stayOpen;
								if (this._stayOpen) {
									$('.ui-datepicker td').removeClass(
											this._currentClass);
									$(td).addClass(this._currentClass);
								}
							}
							inst.selectedDay = inst.currentDay = $('a', td)
									.html();
							inst.selectedMonth = inst.currentMonth = month;
							inst.selectedYear = inst.currentYear = year;
							if (this._stayOpen) {
								inst.endDay = inst.endMonth = inst.endYear = null;
							} else if (rangeSelect) {
								inst.endDay = inst.currentDay;
								inst.endMonth = inst.currentMonth;
								inst.endYear = inst.currentYear;
							}
							this._selectDate(id, this._formatDate(inst,
									inst.currentDay, inst.currentMonth,
									inst.currentYear));
							if (this._stayOpen) {
								inst.rangeStart = new Date(inst.currentYear,
										inst.currentMonth, inst.currentDay);
								this._updateDatepicker(inst);
							} else if (rangeSelect) {
								inst.selectedDay = inst.currentDay = inst.rangeStart
										.getDate();
								inst.selectedMonth = inst.currentMonth = inst.rangeStart
										.getMonth();
								inst.selectedYear = inst.currentYear = inst.rangeStart
										.getFullYear();
								inst.rangeStart = null;
								if (inst.inline)
									this._updateDatepicker(inst);
							}
						},
						_clearDate : function(id) {
							var target = $(id);
							var inst = $.data(target[0], PROP_NAME);
							if (this._get(inst, 'mandatory'))
								return;
							this._stayOpen = false;
							inst.endDay = inst.endMonth = inst.endYear = inst.rangeStart = null;
							this._selectDate(target, '');
						},
						_selectDate : function(id, dateStr) {
							var target = $(id);
							var inst = $.data(target[0], PROP_NAME);
							dateStr = (dateStr != null ? dateStr : this
									._formatDate(inst));
							if (this._get(inst, 'rangeSelect') && dateStr)
								dateStr = (inst.rangeStart ? this._formatDate(
										inst, inst.rangeStart) : dateStr)
										+ this._get(inst, 'rangeSeparator')
										+ dateStr;
							if (inst.input)
								inst.input.val(dateStr);
							this._updateAlternate(inst);
							var onSelect = this._get(inst, 'onSelect');
							if (onSelect)
								onSelect.apply((inst.input ? inst.input[0]
										: null), [ dateStr, inst ]);
							else if (inst.input)
								inst.input.trigger('change');
							if (inst.inline)
								this._updateDatepicker(inst);
							else if (!this._stayOpen) {
								this._hideDatepicker(null, this._get(inst,
										'duration'));
								this._lastInput = inst.input[0];
								if (typeof (inst.input[0]) != 'object')
									inst.input[0].focus();
								this._lastInput = null;
							}
						},
						_updateAlternate : function(inst) {
							var altField = this._get(inst, 'altField');
							if (altField) {
								var altFormat = this._get(inst, 'altFormat');
								var date = this._getDate(inst);
								dateStr = (isArray(date) ? (!date[0]
										&& !date[1] ? '' : this.formatDate(
										altFormat, date[0], this
												._getFormatConfig(inst))
										+ this._get(inst, 'rangeSeparator')
										+ this.formatDate(altFormat, date[1]
												|| date[0], this
												._getFormatConfig(inst)))
										: this.formatDate(altFormat, date, this
												._getFormatConfig(inst)));
								$(altField).each(function() {
									$(this).val(dateStr);
								});
							}
						},
						noWeekends : function(date) {
							var day = date.getDay();
							return [ (day > 0 && day < 6), '' ];
						},
						iso8601Week : function(date) {
							var checkDate = new Date(date.getFullYear(), date
									.getMonth(), date.getDate(), (date
									.getTimezoneOffset() / -60));
							var firstMon = new Date(checkDate.getFullYear(),
									1 - 1, 4);
							var firstDay = firstMon.getDay() || 7;
							firstMon.setDate(firstMon.getDate() + 1 - firstDay);
							if (firstDay < 4 && checkDate < firstMon) {
								checkDate.setDate(checkDate.getDate() - 3);
								return $.datepicker.iso8601Week(checkDate);
							} else if (checkDate > new Date(checkDate
									.getFullYear(), 12 - 1, 28)) {
								firstDay = new Date(
										checkDate.getFullYear() + 1, 1 - 1, 4)
										.getDay() || 7;
								if (firstDay > 4
										&& (checkDate.getDay() || 7) < firstDay - 3) {
									checkDate.setDate(checkDate.getDate() + 3);
									return $.datepicker.iso8601Week(checkDate);
								}
							}
							return Math
									.floor(((checkDate - firstMon) / 86400000) / 7) + 1;
						},
						dateStatus : function(date, inst) {
							return $.datepicker.formatDate($.datepicker._get(
									inst, 'dateStatus'), date, $.datepicker
									._getFormatConfig(inst));
						},
						parseDate : function(format, value, settings) {
							if (format == null || value == null)
								throw 'Invalid arguments';
							value = (typeof value == 'object' ? value
									.toString() : value + '');
							if (value == '')
								return null;
							var shortYearCutoff = (settings ? settings.shortYearCutoff
									: null)
									|| this._defaults.shortYearCutoff;
							var dayNamesShort = (settings ? settings.dayNamesShort
									: null)
									|| this._defaults.dayNamesShort;
							var dayNames = (settings ? settings.dayNames : null)
									|| this._defaults.dayNames;
							var monthNamesShort = (settings ? settings.monthNamesShort
									: null)
									|| this._defaults.monthNamesShort;
							var monthNames = (settings ? settings.monthNames
									: null)
									|| this._defaults.monthNames;
							var year = -1;
							var month = -1;
							var day = -1;
							var literal = false;
							var lookAhead = function(match) {
								var matches = (iFormat + 1 < format.length && format
										.charAt(iFormat + 1) == match);
								if (matches)
									iFormat++;
								return matches;
							};
							var getNumber = function(match) {
								lookAhead(match);
								var origSize = (match == '@' ? 14
										: (match == 'y' ? 4 : 2));
								var size = origSize;
								var num = 0;
								while (size > 0 && iValue < value.length
										&& value.charAt(iValue) >= '0'
										&& value.charAt(iValue) <= '9') {
									num = num * 10
											+ (value.charAt(iValue++) - 0);
									size--;
								}
								if (size == origSize)
									throw 'Missing number at position ' + iValue;
								return num;
							};
							var getName = function(match, shortNames, longNames) {
								var names = (lookAhead(match) ? longNames
										: shortNames);
								var size = 0;
								for ( var j = 0; j < names.length; j++)
									size = Math.max(size, names[j].length);
								var name = '';
								var iInit = iValue;
								while (size > 0 && iValue < value.length) {
									name += value.charAt(iValue++);
									for ( var i = 0; i < names.length; i++)
										if (name == names[i])
											return i + 1;
									size--;
								}
								throw 'Unknown name at position ' + iInit;
							};
							var checkLiteral = function() {
								if (value.charAt(iValue) != format
										.charAt(iFormat))
									throw 'Unexpected literal at position ' + iValue;
								iValue++;
							};
							var iValue = 0;
							for ( var iFormat = 0; iFormat < format.length; iFormat++) {
								if (literal)
									if (format.charAt(iFormat) == "'"
											&& !lookAhead("'"))
										literal = false;
									else
										checkLiteral();
								else
									switch (format.charAt(iFormat)) {
									case 'd':
										day = getNumber('d');
										break;
									case 'D':
										getName('D', dayNamesShort, dayNames);
										break;
									case 'm':
										month = getNumber('m');
										break;
									case 'M':
										month = getName('M', monthNamesShort,
												monthNames);
										break;
									case 'y':
										year = getNumber('y');
										break;
									case '@':
										var date = new Date(getNumber('@'));
										year = date.getFullYear();
										month = date.getMonth() + 1;
										day = date.getDate();
										break;
									case "'":
										if (lookAhead("'"))
											checkLiteral();
										else
											literal = true;
										break;
									default:
										checkLiteral();
									}
							}
							if (year < 100)
								year += new Date().getFullYear()
										- new Date().getFullYear() % 100
										+ (year <= shortYearCutoff ? 0 : -100);
							var date = new Date(year, month - 1, day);
							if (date.getFullYear() != year
									|| date.getMonth() + 1 != month
									|| date.getDate() != day)
								throw 'Invalid date';
							return date;
						},
						ATOM : 'yy-mm-dd',
						COOKIE : 'D, dd M yy',
						ISO_8601 : 'yy-mm-dd',
						RFC_822 : 'D, d M y',
						RFC_850 : 'DD, dd-M-y',
						RFC_1036 : 'D, d M y',
						RFC_1123 : 'D, d M yy',
						RFC_2822 : 'D, d M yy',
						RSS : 'D, d M y',
						TIMESTAMP : '@',
						W3C : 'yy-mm-dd',
						formatDate : function(format, date, settings) {
							if (!date)
								return '';
							var dayNamesShort = (settings ? settings.dayNamesShort
									: null)
									|| this._defaults.dayNamesShort;
							var dayNames = (settings ? settings.dayNames : null)
									|| this._defaults.dayNames;
							var monthNamesShort = (settings ? settings.monthNamesShort
									: null)
									|| this._defaults.monthNamesShort;
							var monthNames = (settings ? settings.monthNames
									: null)
									|| this._defaults.monthNames;
							var lookAhead = function(match) {
								var matches = (iFormat + 1 < format.length && format
										.charAt(iFormat + 1) == match);
								if (matches)
									iFormat++;
								return matches;
							};
							var formatNumber = function(match, value) {
								return (lookAhead(match) && value < 10 ? '0'
										: '')
										+ value;
							};
							var formatName = function(match, value, shortNames,
									longNames) {
								return (lookAhead(match) ? longNames[value]
										: shortNames[value]);
							};
							var output = '';
							var literal = false;
							if (date)
								for ( var iFormat = 0; iFormat < format.length; iFormat++) {
									if (literal)
										if (format.charAt(iFormat) == "'"
												&& !lookAhead("'"))
											literal = false;
										else
											output += format.charAt(iFormat);
									else
										switch (format.charAt(iFormat)) {
										case 'd':
											output += formatNumber('d', date
													.getDate());
											break;
										case 'D':
											output += formatName('D', date
													.getDay(), dayNamesShort,
													dayNames);
											break;
										case 'm':
											output += formatNumber('m', date
													.getMonth() + 1);
											break;
										case 'M':
											output += formatName('M', date
													.getMonth(),
													monthNamesShort, monthNames);
											break;
										case 'y':
											output += (lookAhead('y') ? date
													.getFullYear() : (date
													.getYear() % 100 < 10 ? '0'
													: '')
													+ date.getYear() % 100);
											break;
										case '@':
											output += date.getTime();
											break;
										case "'":
											if (lookAhead("'"))
												output += "'";
											else
												literal = true;
											break;
										default:
											output += format.charAt(iFormat);
										}
								}
							return output;
						},
						_possibleChars : function(format) {
							var chars = '';
							var literal = false;
							for ( var iFormat = 0; iFormat < format.length; iFormat++)
								if (literal)
									if (format.charAt(iFormat) == "'"
											&& !lookAhead("'"))
										literal = false;
									else
										chars += format.charAt(iFormat);
								else
									switch (format.charAt(iFormat)) {
									case 'd':
									case 'm':
									case 'y':
									case '@':
										chars += '0123456789';
										break;
									case 'D':
									case 'M':
										return null;
									case "'":
										if (lookAhead("'"))
											chars += "'";
										else
											literal = true;
										break;
									default:
										chars += format.charAt(iFormat);
									}
							return chars;
						},
						_get : function(inst, name) {
							return inst.settings[name] !== undefined ? inst.settings[name]
									: this._defaults[name];
						},
						_setDateFromField : function(inst) {
							var dateFormat = this._get(inst, 'dateFormat');
							var dates = inst.input ? inst.input.val().split(
									this._get(inst, 'rangeSeparator')) : null;
							inst.endDay = inst.endMonth = inst.endYear = null;
							var date = defaultDate = this._getDefaultDate(inst);
							if (dates.length > 0) {
								var settings = this._getFormatConfig(inst);
								if (dates.length > 1) {
									date = this.parseDate(dateFormat, dates[1],
											settings)
											|| defaultDate;
									inst.endDay = date.getDate();
									inst.endMonth = date.getMonth();
									inst.endYear = date.getFullYear();
								}
								try {
									date = this.parseDate(dateFormat, dates[0],
											settings)
											|| defaultDate;
								} catch (e) {
									this.log(e);
									date = defaultDate;
								}
							}
							inst.selectedDay = date.getDate();
							inst.drawMonth = inst.selectedMonth = date
									.getMonth();
							inst.drawYear = inst.selectedYear = date
									.getFullYear();
							inst.currentDay = (dates[0] ? date.getDate() : 0);
							inst.currentMonth = (dates[0] ? date.getMonth() : 0);
							inst.currentYear = (dates[0] ? date.getFullYear()
									: 0);
							this._adjustInstDate(inst);
						},
						_getDefaultDate : function(inst) {
							var date = this._determineDate(this._get(inst,
									'defaultDate'), new Date());
							var minDate = this
									._getMinMaxDate(inst, 'min', true);
							var maxDate = this._getMinMaxDate(inst, 'max');
							date = (minDate && date < minDate ? minDate : date);
							date = (maxDate && date > maxDate ? maxDate : date);
							return date;
						},
						_determineDate : function(date, defaultDate) {
							var offsetNumeric = function(offset) {
								var date = new Date();
								date.setUTCDate(date.getUTCDate() + offset);
								return date;
							};
							var offsetString = function(offset, getDaysInMonth) {
								var date = new Date();
								var year = date.getFullYear();
								var month = date.getMonth();
								var day = date.getDate();
								var pattern = /([+-]?[0-9]+)\s*(d|D|w|W|m|M|y|Y)?/g;
								var matches = pattern.exec(offset);
								while (matches) {
									switch (matches[2] || 'd') {
									case 'd':
									case 'D':
										day += (matches[1] - 0);
										break;
									case 'w':
									case 'W':
										day += (matches[1] * 7);
										break;
									case 'm':
									case 'M':
										month += (matches[1] - 0);
										day = Math.min(day, getDaysInMonth(
												year, month));
										break;
									case 'y':
									case 'Y':
										year += (matches[1] - 0);
										day = Math.min(day, getDaysInMonth(
												year, month));
										break;
									}
									matches = pattern.exec(offset);
								}
								return new Date(year, month, day);
							};
							return (date == null ? defaultDate
									: (typeof date == 'string' ? offsetString(
											date, this._getDaysInMonth)
											: (typeof date == 'number' ? offsetNumeric(date)
													: date)));
						},
						_setDate : function(inst, date, endDate) {
							var clear = !(date);
							date = this._determineDate(date, new Date());
							inst.selectedDay = inst.currentDay = date.getDate();
							inst.drawMonth = inst.selectedMonth = inst.currentMonth = date
									.getMonth();
							inst.drawYear = inst.selectedYear = inst.currentYear = date
									.getFullYear();
							if (this._get(inst, 'rangeSelect')) {
								if (endDate) {
									endDate = this
											._determineDate(endDate, null);
									inst.endDay = endDate.getDate();
									inst.endMonth = endDate.getMonth();
									inst.endYear = endDate.getFullYear();
								} else {
									inst.endDay = inst.currentDay;
									inst.endMonth = inst.currentMonth;
									inst.endYear = inst.currentYear;
								}
							}
							this._adjustInstDate(inst);
							if (inst.input)
								inst.input.val(clear ? '' : this
										._formatDate(inst)
										+ (!this._get(inst, 'rangeSelect') ? ''
												: this._get(inst,
														'rangeSeparator')
														+ this._formatDate(
																inst,
																inst.endDay,
																inst.endMonth,
																inst.endYear)));
						},
						_getDate : function(inst) {
							var startDate = (!inst.currentYear
									|| (inst.input && inst.input.val() == '') ? null
									: new Date(inst.currentYear,
											inst.currentMonth, inst.currentDay));
							if (this._get(inst, 'rangeSelect')) {
								return [
										inst.rangeStart || startDate,
										(!inst.endYear ? null : new Date(
												inst.endYear, inst.endMonth,
												inst.endDay)) ];
							} else
								return startDate;
						},
						_generateDatepicker : function(inst) {
							var today = new Date();
							today = new Date(today.getFullYear(), today
									.getMonth(), today.getDate());
							var showStatus = this._get(inst, 'showStatus');
							var isRTL = this._get(inst, 'isRTL');
							var clear = (this._get(inst, 'mandatory') ? ''
									: '<div class="ui-datepicker-clear"><a onclick="jQuery.datepicker._clearDate(\'#'
											+ inst.id
											+ '\');"'
											+ (showStatus ? this
													._addStatus(
															inst,
															this
																	._get(inst,
																			'clearStatus') || '&#xa0;')
													: '')
											+ '>'
											+ this._get(inst, 'clearText')
											+ '</a></div>');
							var controls = '<div class="ui-datepicker-control">'
									+ (isRTL ? '' : clear)
									+ '<div class="ui-datepicker-close"><a onclick="jQuery.datepicker._hideDatepicker();"'
									+ (showStatus ? this
											._addStatus(inst, this._get(inst,
													'closeStatus') || '&#xa0;')
											: '')
									+ '>'
									+ this._get(inst, 'closeText')
									+ '</a></div>'
									+ (isRTL ? clear : '')
									+ '</div>';
							var prompt = this._get(inst, 'prompt');
							var closeAtTop = this._get(inst, 'closeAtTop');
							var hideIfNoPrevNext = this._get(inst,
									'hideIfNoPrevNext');
							var navigationAsDateFormat = this._get(inst,
									'navigationAsDateFormat');
							var numMonths = this._getNumberOfMonths(inst);
							var stepMonths = this._get(inst, 'stepMonths');
							var isMultiMonth = (numMonths[0] != 1 || numMonths[1] != 1);
							var currentDate = (!inst.currentDay ? new Date(
									9999, 9, 9) : new Date(inst.currentYear,
									inst.currentMonth, inst.currentDay));
							var minDate = this
									._getMinMaxDate(inst, 'min', true);
							var maxDate = this._getMinMaxDate(inst, 'max');
							var drawMonth = inst.drawMonth;
							var drawYear = inst.drawYear;
							if (maxDate) {
								var maxDraw = new Date(maxDate.getFullYear(),
										maxDate.getMonth() - numMonths[1] + 1,
										maxDate.getDate());
								maxDraw = (minDate && maxDraw < minDate ? minDate
										: maxDraw);
								while (new Date(drawYear, drawMonth, 1) > maxDraw) {
									drawMonth--;
									if (drawMonth < 0) {
										drawMonth = 11;
										drawYear--;
									}
								}
							}
							var prevText = this._get(inst, 'prevText');
							prevText = (!navigationAsDateFormat ? prevText
									: this.formatDate(prevText,
											new Date(drawYear, drawMonth
													- stepMonths, 1), this
													._getFormatConfig(inst)));
							var prev = '<div class="ui-datepicker-prev">' + (this
									._canAdjustMonth(inst, -1, drawYear,
											drawMonth) ? '<a onclick="jQuery.datepicker._adjustDate(\'#'
									+ inst.id
									+ '\', -'
									+ stepMonths
									+ ', \'M\');"'
									+ (showStatus ? this
											._addStatus(inst, this._get(inst,
													'prevStatus') || '&#xa0;')
											: '') + '>' + prevText + '</a>'
									: (hideIfNoPrevNext ? ''
											: '<label>' + prevText + '</label>')) + '</div>';
							var nextText = this._get(inst, 'nextText');
							nextText = (!navigationAsDateFormat ? nextText
									: this.formatDate(nextText,
											new Date(drawYear, drawMonth
													+ stepMonths, 1), this
													._getFormatConfig(inst)));
							var next = '<div class="ui-datepicker-next">' + (this
									._canAdjustMonth(inst, +1, drawYear,
											drawMonth) ? '<a onclick="jQuery.datepicker._adjustDate(\'#'
									+ inst.id
									+ '\', +'
									+ stepMonths
									+ ', \'M\');"'
									+ (showStatus ? this
											._addStatus(inst, this._get(inst,
													'nextStatus') || '&#xa0;')
											: '') + '>' + nextText + '</a>'
									: (hideIfNoPrevNext ? ''
											: '<label>' + nextText + '</label>')) + '</div>';
							var currentText = this._get(inst, 'currentText');
							currentText = (!navigationAsDateFormat ? currentText
									: this.formatDate(currentText, today, this
											._getFormatConfig(inst)));
							var html = (prompt ? '<div class="'
									+ this._promptClass + '">' + prompt
									+ '</div>' : '')
									+ (closeAtTop && !inst.inline ? controls
											: '')
									+ '<div class="ui-datepicker-links">'
									+ (isRTL ? next : prev)
									+ (this._isInRange(inst, (this._get(inst,
											'gotoCurrent')
											&& inst.currentDay ? currentDate
											: today)) ? '<div class="ui-datepicker-current">'
											+ '<a onclick="jQuery.datepicker._gotoToday(\'#'
											+ inst.id
											+ '\');"'
											+ (showStatus ? this
													._addStatus(
															inst,
															this
																	._get(inst,
																			'currentStatus') || '&#xa0;')
													: '')
											+ '>'
											+ currentText
											+ '</a></div>'
											: '')
									+ (isRTL ? prev : next)
									+ '</div>';
							var firstDay = this._get(inst, 'firstDay');
							var changeFirstDay = this._get(inst,
									'changeFirstDay');
							var dayNames = this._get(inst, 'dayNames');
							var dayNamesShort = this
									._get(inst, 'dayNamesShort');
							var dayNamesMin = this._get(inst, 'dayNamesMin');
							var monthNames = this._get(inst, 'monthNames');
							var beforeShowDay = this
									._get(inst, 'beforeShowDay');
							var highlightWeek = this
									._get(inst, 'highlightWeek');
							var showOtherMonths = this._get(inst,
									'showOtherMonths');
							var showWeeks = this._get(inst, 'showWeeks');
							var calculateWeek = this
									._get(inst, 'calculateWeek')
									|| this.iso8601Week;
							var status = (showStatus ? this._get(inst,
									'dayStatus') || '&#xa0;' : '');
							var dateStatus = this._get(inst, 'statusForDate')
									|| this.dateStatus;
							var endDate = inst.endDay ? new Date(inst.endYear,
									inst.endMonth, inst.endDay) : currentDate;
							for ( var row = 0; row < numMonths[0]; row++)
								for ( var col = 0; col < numMonths[1]; col++) {
									var selectedDate = new Date(drawYear,
											drawMonth, inst.selectedDay);
									html += '<div class="ui-datepicker-one-month'
											+ (col == 0 ? ' ui-datepicker-new-row'
													: '')
											+ '">'
											+ this._generateMonthYearHeader(
													inst, drawMonth, drawYear,
													minDate, maxDate,
													selectedDate, row > 0
															|| col > 0,
													showStatus, monthNames)
											+ '<table class="ui-datepicker" cellpadding="0" cellspacing="0"><thead>'
											+ '<tr class="ui-datepicker-title-row">'
											+ (showWeeks ? '<td>' + this._get(
													inst, 'weekHeader') + '</td>'
													: '');
									for ( var dow = 0; dow < 7; dow++) {
										var day = (dow + firstDay) % 7;
										var dayStatus = (status.indexOf('DD') > -1 ? status
												.replace(/DD/, dayNames[day])
												: status.replace(/D/,
														dayNamesShort[day]));
										html += '<td'
												+ ((dow + firstDay + 6) % 7 >= 5 ? ' class="ui-datepicker-week-end-cell"'
														: '')
												+ '>'
												+ (!changeFirstDay ? '<span'
														: '<a onclick="jQuery.datepicker._changeFirstDay(\'#'
																+ inst.id
																+ '\', '
																+ day
																+ ');"')
												+ (showStatus ? this
														._addStatus(inst,
																dayStatus) : '')
												+ ' title="'
												+ dayNames[day]
												+ '">'
												+ dayNamesMin[day]
												+ (changeFirstDay ? '</a>'
														: '</span>') + '</td>';
									}
									html += '</tr></thead><tbody>';
									var daysInMonth = this._getDaysInMonth(
											drawYear, drawMonth);
									if (drawYear == inst.selectedYear
											&& drawMonth == inst.selectedMonth)
										inst.selectedDay = Math.min(
												inst.selectedDay, daysInMonth);
									var leadDays = (this._getFirstDayOfMonth(
											drawYear, drawMonth)
											- firstDay + 7) % 7;
									var printDate = new Date(drawYear,
											drawMonth, 1 - leadDays);
									var numRows = (isMultiMonth ? 6 : Math
											.ceil((leadDays + daysInMonth) / 7));
									for ( var dRow = 0; dRow < numRows; dRow++) {
										html += '<tr class="ui-datepicker-days-row">' + (showWeeks ? '<td class="ui-datepicker-week-col">' + calculateWeek(printDate) + '</td>'
												: '');
										for ( var dow = 0; dow < 7; dow++) {
											var daySettings = (beforeShowDay ? beforeShowDay
													.apply(
															(inst.input ? inst.input[0]
																	: null),
															[ printDate ])
													: [ true, '' ]);
											var otherMonth = (printDate
													.getMonth() != drawMonth);
											var unselectable = otherMonth
													|| !daySettings[0]
													|| (minDate && printDate < minDate)
													|| (maxDate && printDate > maxDate);
											html += '<td class="ui-datepicker-days-cell'
													+ ((dow + firstDay + 6) % 7 >= 5 ? ' ui-datepicker-week-end-cell'
															: '')
													+ (otherMonth ? ' ui-datepicker-otherMonth'
															: '')
													+ (printDate.getTime() == selectedDate
															.getTime()
															&& drawMonth == inst.selectedMonth ? ' ui-datepicker-days-cell-over'
															: '')
													+ (unselectable ? ' ' + this._unselectableClass
															: '')
													+ (otherMonth
															&& !showOtherMonths ? ''
															: ' '
																	+ daySettings[1]
																	+ (printDate
																			.getTime() >= currentDate
																			.getTime()
																			&& printDate
																					.getTime() <= endDate
																					.getTime() ? ' ' + this._currentClass
																			: '')
																	+ (printDate
																			.getTime() == today
																			.getTime() ? ' ui-datepicker-today'
																			: ''))
													+ '"'
													+ ((!otherMonth || showOtherMonths)
															&& daySettings[2] ? ' title="' + daySettings[2] + '"'
															: '')
													+ (unselectable ? (highlightWeek ? ' onmouseover="jQuery(this).parent().addClass(\'ui-datepicker-week-over\');"' + ' onmouseout="jQuery(this).parent().removeClass(\'ui-datepicker-week-over\');"'
															: '')
															: ' onmouseover="jQuery(this).addClass(\'ui-datepicker-days-cell-over\')'
																	+ (highlightWeek ? '.parent().addClass(\'ui-datepicker-week-over\')'
																			: '')
																	+ ';'
																	+ (!showStatus
																			|| (otherMonth && !showOtherMonths) ? ''
																			: 'jQuery(\'#ui-datepicker-status-'
																					+ inst.id
																					+ '\').html(\''
																					+ (dateStatus
																							.apply(
																									(inst.input ? inst.input[0]
																											: null),
																									[
																											printDate,
																											inst ]) || '&#xa0;')
																					+ '\');')
																	+ '"'
																	+ ' onmouseout="jQuery(this).removeClass(\'ui-datepicker-days-cell-over\')'
																	+ (highlightWeek ? '.parent().removeClass(\'ui-datepicker-week-over\')'
																			: '')
																	+ ';'
																	+ (!showStatus
																			|| (otherMonth && !showOtherMonths) ? ''
																			: 'jQuery(\'#ui-datepicker-status-' + inst.id + '\').html(\'&#xa0;\');')
																	+ '" onclick="jQuery.datepicker._selectDay(\'#'
																	+ inst.id
																	+ '\','
																	+ drawMonth
																	+ ','
																	+ drawYear
																	+ ', this);"')
													+ '>'
													+ (otherMonth ? (showOtherMonths ? printDate
															.getDate()
															: '&#xa0;')
															: (unselectable ? printDate
																	.getDate()
																	: '<a>' + printDate
																			.getDate() + '</a>'))
													+ '</td>';
											printDate.setUTCDate(printDate
													.getUTCDate() + 1);
										}
										html += '</tr>';
									}
									drawMonth++;
									if (drawMonth > 11) {
										drawMonth = 0;
										drawYear++;
									}
									html += '</tbody></table></div>';
								}
							html += (showStatus ? '<div style="clear: both;"></div><div id="ui-datepicker-status-'
									+ inst.id
									+ '" class="ui-datepicker-status">'
									+ (this._get(inst, 'initStatus') || '&#xa0;')
									+ '</div>'
									: '')
									+ (!closeAtTop && !inst.inline ? controls
											: '')
									+ '<div style="clear: both;"></div>'
									+ ($.browser.msie
											&& parseInt($.browser.version) < 7
											&& !inst.inline ? '<iframe src="javascript:false;" class="ui-datepicker-cover"></iframe>'
											: '');
							return html;
						},
						_generateMonthYearHeader : function(inst, drawMonth,
								drawYear, minDate, maxDate, selectedDate,
								secondary, showStatus, monthNames) {
							minDate = (inst.rangeStart && minDate
									&& selectedDate < minDate ? selectedDate
									: minDate);
							var html = '<div class="ui-datepicker-header">';
							if (secondary || !this._get(inst, 'changeMonth'))
								html += monthNames[drawMonth] + '&#xa0;';
							else {
								var inMinYear = (minDate && minDate
										.getFullYear() == drawYear);
								var inMaxYear = (maxDate && maxDate
										.getFullYear() == drawYear);
								html += '<select class="ui-datepicker-new-month" '
										+ 'onchange="jQuery.datepicker._selectMonthYear(\'#'
										+ inst.id
										+ '\', this, \'M\');" '
										+ 'onclick="jQuery.datepicker._clickMonthYear(\'#'
										+ inst.id
										+ '\');"'
										+ (showStatus ? this
												._addStatus(
														inst,
														this._get(inst,
																'monthStatus') || '&#xa0;')
												: '') + '>';
								for ( var month = 0; month < 12; month++) {
									if ((!inMinYear || month >= minDate
											.getMonth())
											&& (!inMaxYear || month <= maxDate
													.getMonth()))
										html += '<option value="'
												+ month
												+ '"'
												+ (month == drawMonth ? ' selected="selected"'
														: '') + '>'
												+ monthNames[month]
												+ '</option>';
								}
								html += '</select>';
							}
							if (secondary || !this._get(inst, 'changeYear'))
								html += drawYear;
							else {
								var years = this._get(inst, 'yearRange').split(
										':');
								var year = 0;
								var endYear = 0;
								if (years.length != 2) {
									year = drawYear - 10;
									endYear = drawYear + 10;
								} else if (years[0].charAt(0) == '+'
										|| years[0].charAt(0) == '-') {
									year = endYear = new Date().getFullYear();
									year += parseInt(years[0], 10);
									endYear += parseInt(years[1], 10);
								} else {
									year = parseInt(years[0], 10);
									endYear = parseInt(years[1], 10);
								}
								year = (minDate ? Math.max(year, minDate
										.getFullYear()) : year);
								endYear = (maxDate ? Math.min(endYear, maxDate
										.getFullYear()) : endYear);
								html += '<select class="ui-datepicker-new-year" '
										+ 'onchange="jQuery.datepicker._selectMonthYear(\'#'
										+ inst.id
										+ '\', this, \'Y\');" '
										+ 'onclick="jQuery.datepicker._clickMonthYear(\'#'
										+ inst.id
										+ '\');"'
										+ (showStatus ? this
												._addStatus(
														inst,
														this._get(inst,
																'yearStatus') || '&#xa0;')
												: '') + '>';
								for (; year <= endYear; year++) {
									html += '<option value="'
											+ year
											+ '"'
											+ (year == drawYear ? ' selected="selected"'
													: '') + '>' + year
											+ '</option>';
								}
								html += '</select>';
							}
							html += '</div>';
							return html;
						},
						_addStatus : function(inst, text) {
							return ' onmouseover="jQuery(\'#ui-datepicker-status-'
									+ inst.id
									+ '\').html(\''
									+ text
									+ '\');" '
									+ 'onmouseout="jQuery(\'#ui-datepicker-status-'
									+ inst.id + '\').html(\'&#xa0;\');"';
						},
						_adjustInstDate : function(inst, offset, period) {
							var year = inst.drawYear
									+ (period == 'Y' ? offset : 0);
							var month = inst.drawMonth
									+ (period == 'M' ? offset : 0);
							var day = Math.min(inst.selectedDay, this
									._getDaysInMonth(year, month))
									+ (period == 'D' ? offset : 0);
							var date = new Date(year, month, day);
							var minDate = this
									._getMinMaxDate(inst, 'min', true);
							var maxDate = this._getMinMaxDate(inst, 'max');
							date = (minDate && date < minDate ? minDate : date);
							date = (maxDate && date > maxDate ? maxDate : date);
							inst.selectedDay = date.getDate();
							inst.drawMonth = inst.selectedMonth = date
									.getMonth();
							inst.drawYear = inst.selectedYear = date
									.getFullYear();
							if (period == 'M' || period == 'Y')
								this._notifyChange(inst);
						},
						_notifyChange : function(inst) {
							var onChange = this._get(inst, 'onChangeMonthYear');
							if (onChange)
								onChange.apply((inst.input ? inst.input[0]
										: null), [
										new Date(inst.selectedYear,
												inst.selectedMonth, 1), inst ]);
						},
						_getNumberOfMonths : function(inst) {
							var numMonths = this._get(inst, 'numberOfMonths');
							return (numMonths == null ? [ 1, 1 ]
									: (typeof numMonths == 'number' ? [ 1,
											numMonths ] : numMonths));
						},
						_getMinMaxDate : function(inst, minMax, checkRange) {
							var date = this._determineDate(this._get(inst,
									minMax + 'Date'), null);
							if (date) {
								date.setHours(0);
								date.setMinutes(0);
								date.setSeconds(0);
								date.setMilliseconds(0);
							}
							return (!checkRange || !inst.rangeStart ? date
									: (!date || inst.rangeStart > date ? inst.rangeStart
											: date));
						},
						_getDaysInMonth : function(year, month) {
							return 32 - new Date(year, month, 32).getDate();
						},
						_getFirstDayOfMonth : function(year, month) {
							return new Date(year, month, 1).getDay();
						},
						_canAdjustMonth : function(inst, offset, curYear,
								curMonth) {
							var numMonths = this._getNumberOfMonths(inst);
							var date = new Date(curYear, curMonth
									+ (offset < 0 ? offset : numMonths[1]), 1);
							if (offset < 0)
								date.setDate(this._getDaysInMonth(date
										.getFullYear(), date.getMonth()));
							return this._isInRange(inst, date);
						},
						_isInRange : function(inst, date) {
							var newMinDate = (!inst.rangeStart ? null
									: new Date(inst.selectedYear,
											inst.selectedMonth,
											inst.selectedDay));
							newMinDate = (newMinDate
									&& inst.rangeStart < newMinDate ? inst.rangeStart
									: newMinDate);
							var minDate = newMinDate
									|| this._getMinMaxDate(inst, 'min');
							var maxDate = this._getMinMaxDate(inst, 'max');
							return ((!minDate || date >= minDate) && (!maxDate || date <= maxDate));
						},
						_getFormatConfig : function(inst) {
							var shortYearCutoff = this._get(inst,
									'shortYearCutoff');
							shortYearCutoff = (typeof shortYearCutoff != 'string' ? shortYearCutoff
									: new Date().getFullYear() % 100
											+ parseInt(shortYearCutoff, 10));
							return {
								shortYearCutoff : shortYearCutoff,
								dayNamesShort : this
										._get(inst, 'dayNamesShort'),
								dayNames : this._get(inst, 'dayNames'),
								monthNamesShort : this._get(inst,
										'monthNamesShort'),
								monthNames : this._get(inst, 'monthNames')
							};
						},
						_formatDate : function(inst, day, month, year) {
							if (!day) {
								inst.currentDay = inst.selectedDay;
								inst.currentMonth = inst.selectedMonth;
								inst.currentYear = inst.selectedYear;
							}
							var date = (day ? (typeof day == 'object' ? day
									: new Date(year, month, day)) : new Date(
									inst.currentYear, inst.currentMonth,
									inst.currentDay));
							return this.formatDate(this
									._get(inst, 'dateFormat'), date, this
									._getFormatConfig(inst));
						}
					});
	function extendRemove(target, props) {
		$.extend(target, props);
		for ( var name in props)
			if (props[name] == null || props[name] == undefined)
				target[name] = props[name];
		return target;
	}
	;
	function isArray(a) {
		return (a && (($.browser.safari && typeof a == 'object' && a.length) || (a.constructor && a.constructor
				.toString().match(/\Array\(\)/))));
	}
	;
	$.fn.datepicker = function(options) {
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string'
				&& (options == 'isDisabled' || options == 'getDate'))
			return $.datepicker['_' + options + 'Datepicker'].apply(
					$.datepicker, [ this[0] ].concat(otherArgs));
		return this
				.each(function() {
					typeof options == 'string' ? $.datepicker['_' + options + 'Datepicker']
							.apply($.datepicker, [ this ].concat(otherArgs))
							: $.datepicker._attachDatepicker(this, options);
				});
	};
	$.datepicker = new Datepicker();
	$(document).ready(
			function() {
				$(document.body).append($.datepicker.dpDiv).mousedown(
						$.datepicker._checkExternalClick);
			});
})(jQuery);