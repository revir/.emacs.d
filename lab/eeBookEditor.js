/**
 *
 * @param ebookId
 *            The eebook's ID,defulte 0
 * @param pageListDiv
 *            The page list Div's Id,defulte 'page_list'
 *
 * @todo:
 */
(function($){
    window.eeBookEditor = function(eeBook){
        var self = this;
        
        // for text edit
        this.doc = document;
        this.selection = new this.selection(this);
        
        this.i18n = this.i18[this.mateBoxSetting.lang];
        
        // ui
        this.toolbars = {};
        var toolbarsOpts = this.toolbarsOpts(this);
        this.eeBookToolbar = $('#eebook-toolbar').eebeEEBookToolbar(this, this.eeBook).eebeToolbar(this, {
            toolbar: toolbarsOpts['eeBookToolbar']
        });
        this.pageToolbar = $('<div id="page-toolbar"/>').eebeToolbar(this, {
            toolbar: toolbarsOpts['pageToolbar']
        }).appendTo($('#toolbar-container'));
        this.textToolbar = $('<div id="text-toolbar"/>').eebeToolbar(this, {
            toolbar: toolbarsOpts['textToolbar']
        }).appendTo($('#toolbar-container'));
        
        this.mateBox = $('#mate-area').elfinder(this.mateBoxSetting, this).elfinder('instance');// 素材区
        this.thumbPanel = $('<div/>').eebePageThumbPanel(this, $('#thumb-panel-placeholder'));// 页面缩略图列表区
        this.editPanel = this.initEditPanel($('#edit-panel-placeholder'));// 包含当前编辑页面的区
        this.contextmenu = $('<div id="contextmenu"/>').eebeMenu(this).appendTo('body');
        $('body').click(function(){
            self.contextmenu.close()
        });
        
        // data
        this.eeBookId = eeBook.id;
        this.eeBook = eeBook;
        this.cache = new this.cache(this, eeBook.pages); // 页面缓存
        this.shortcutManager = new this.shortcutManager(this);
        this.history = new this.history(this);
        this.clipboard = new this.clipboard(this);
        this.currentPageId;
        this.currentPage;
        this.pageRuler = {};
        
        // init auto save all modify to pages
        if (this.setting.isAutoSave) {
            window.setInterval(function(){
                self.trigger('save');
            }, this.setting.autoSaveDelay);
        }
        
        // forbid other context menu
        window.document.oncontextmenu = function(){
            return false;
        };
        
        // init commands(the M of MVC)
        var baseCommand = new this.command(this);
        $.each(this.commands, function(name, command){
            command.prototype = baseCommand;
            var cmd = new command();
            self.bind(name, $.proxy(cmd.exec, cmd));
            cmd.init(name);
        });
    };
    
    /**
     *
     */
    eeBookEditor.prototype = {
    
        /**
         * Internationalization object
         *
         * @type Object
         */
        i18: {},
        
        /**
         * Commands costructors
         *
         * @type Object
         */
        commands: {},
        
        /**
         * Events listeners
         *
         * @type Object
         */
        listeners: {},
        
        /**
         * Attach listener to events To bind to multiply events at once,
         * separate events names by space
         *
         * @param String
         *            event(s) name(s)
         * @param Object
         *            event handler
         * @return elFinder
         */
        bind: function(event, callback){
            var i;
            
            if (typeof(callback) == 'function') {
                var events = ('' + event).toLowerCase().split(/\s+/);
                
                for (i = 0; i < events.length; i++) {
                    if (!this.listeners.hasOwnProperty(events[i])) {
                        this.listeners[events[i]] = [];
                    }
                    this.listeners[events[i]].push(callback);
                }
            }
            return this;
        },
        
        /**
         * Bind callback to event(s) The callback is executed at most once per
         * event. To bind to multiply events at once, separate events names by
         * space
         *
         * @param String
         *            event name
         * @param Function
         *            callback
         * @return elFinder
         */
        one: function(event, callback){
            var self = this;
            var newCallback = function(){
                callback();
                self.unbind(event, newCallback);
            };
            return this.bind(event, newCallback);
        },
        
        /**
         * Remove event listener if exists
         *
         * @param String
         *            event name
         * @param Function
         *            callback
         * @return elFinder
         */
        unbind: function(event, callback){
            var events = this.listeners[('' + event).toLowerCase()] || [];
            var i = events.indexOf(callback);
            
            i > -1 && events.splice(i, 1);
            callback = null
            return this;
        },
        
        /**
         * Fire event - send notification to all event listeners
         *
         * @param String
         *            event name
         * @param Object
         *            data to send across event
         * @return elFinder
         */
        trigger: function(eventName, data){
            var eventName = eventName.toLowerCase();
            var handlers = this.listeners[eventName] || [];
            var i;
            
            if (handlers.length) {
                var event = $.Event(eventName);
                console.log('触发事件：' + eventName);
                
                for (i = 0; i < handlers.length; i++) {
                    // to avoid data modifications. remember about "sharing"
                    // passing arguments in js :)
                    event.data = $.extend(true, {}, data);
                    var handler = handlers[i];
                    var temp = handler(event, this);// 通过event传递最初的事件名及数据
                    if (temp === false || event.isDefaultPrevented()) {
                        console.log('event ' + eventName + ' stoped');
                        break;
                    }
                }
            }
            return this;
        },
        
        tip: function(msg){
            $.blockUI({
                message: '<h3>' + msg + '</h3>',
                showOverlay: false,
                centerY: true,
                centerX: true,
                css: {
                    width: '200px',
                    left: (screen.width - 200) / 2,
                    border: 'none',
                    "border-radius": "5px",
                    "-moz-border-radius": "5px",
                    "-webkit-border-radius": "5px",
                    padding: '15px',
                    backgroundColor: '#75C0FD',
                    opacity: .5,
                    color: '#000'
                }
            });
            setTimeout($.unblockUI, 1500);
        },
        
        initEditPanel: function(placeholder){
            var editpanel =  $('<div/>').css({
                width: placeholder.width(),
                height: placeholder.height(),
                position: 'absolute',
                'top': 0,
                'left': 0,
                'overflow': 'scroll',
                'border-right': '2px solid #75C0FD',
            }).attr("id", "edit-panel");
            var pageRuler = $('<div/>').css({
                width: placeholder.width(),
                height: placeholder.height(),
                position: 'absolute',
                'top': placeholder.offset().top,
                'left': placeholder.offset().left,
                'overflow': 'hidden',
            }).attr("id", "page-ruler");
            pageRuler.append(editpanel);
            pageRuler.appendTo(placeholder.parent());
            return editpanel;
        },
        
        /**
         * 显示素材文件选择器
         *
         * @param {Object}
         *            title
         * @param {Object}
         *            checkCallback
         */
        showMateSelector: function(title, checkCallback){
            var setting = this.mateBoxDialogSetting;
            setting.title = title;
            setting.checkSelectorCallback = checkCallback;
            this.mateBoxDialog = $('<div/>').dialogelfinder(setting, this);
        },
        
        pageDropMark: true,
        pageDroppable: function(enable){
            if ((enable == true) && (this.pageDropMark == true)) {
                this.currentPage.droppable('enable');
            }
            else {
                this.currentPage.droppable('disable');
            }
        },
        
        /**
         * 为系统已定义命令创建菜单项
         *
         * @param {Object}
         *            cmdName
         */
        createMenuItems4Cmd: function(cmdNameArray){
            var self = this;
            var items = $.map(cmdNameArray, function(cmdName){
                if (cmdName == '|') 
                    return self.createMenuItemSep();
                return {
                    label: self.i18n.messages[cmdName],
                    icon: cmdName,
                    callback: function(){
                        self.trigger(cmdName);
                    }
                };
            });
            return items;
        },
        
        /**
         * 创建菜单项分割线
         */
        createMenuItemSep: function(){
            return {
                label: 'sep'
            };
        },
        
        toolbarsOpts: function(eebe){
        
            return {
                eeBookToolbar: [{
                    buttonNames: ['save', 'preview', 'publish', 'export'],
                    type : 'main',
                    onClicks: {
                        'export': function(){
                            var url = 'ebook/export.action?id=' + eebe.eeBookId;
                            window.location = url;
                        }
                    }
                }],
                pageToolbar: [{
                    buttonNames: ['undo', 'redo'],
                    first: true,
                    type : 'special',
                }, {
                    buttonNames: ['copy', 'cut', 'paste', 'remove'],
                    type : 'special',
                }, {
                    buttonNames: ['htextbox', 'picture', 'images', 'audio', 'video', 'switchtextlayer'],
                    type : 'main',
                    titles: {
                        switchtextlayer: this.i18n.messages['activetextlayer']
                    },
                    iconClasses: {
                        switchtextlayer: 'icon-activetextlayer'
                    },
                    onClicks: {
                        htextbox: 'inserttextbox',
                        audio: 'insertaudio',
                        video: 'insertvideo',
                        picture: 'insertimage',
                        images: 'insertimagesbox',
			switchtextlayer: function(){
                            var button = this;
                            var change = function(oldClass, newClass, editable){
                                button.removeClass('icon-' + oldClass);
                                button.addClass('icon-' + newClass);
                                button.attr('title', eebe.i18n.messages[newClass]);
                                eebe.trigger('switchtextlayer', {
                                    editable: editable
                                });
                            };
                            if (this.hasClass('icon-activetextlayer')) {
                                change('activetextlayer', 'locktextlayer', true);
                            }
                            else {
                                change('locktextlayer', 'activetextlayer', false);
                            }
                        }
                    }
                }, {
                    buttonNames: ['pagebgcolor', 'pagebgimage', 'clearpagebg'],
                    type : 'main',
                    onCreates: {
                        pagebgcolor: function(){
                            this.elColorPicker({
                                change: function(colorValue){
                                    eebe.trigger('setpagebgcolor', {
                                        colorValue: colorValue
                                    });
                                }
                            });
                        }
                    },
                    onClicks: {
                        pagebgcolor: undefined,
                        pagebgimage: 'setpagebgimage'
                    },
                }, {
                    buttonNames: ['zoomin', 'zoomout', 'zoomsuitable'],
                    type : 'main',
                }],
                
                textToolbar: [{
                    buttonNames: ['bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript'],
                    type : 'text',
                    onClicks: {
                        bold: function(){
                            window.document.execCommand('bold');
                            eebe.trigger('cache');
                        },
                        italic: function(){
                            window.document.execCommand('italic');
                            eebe.trigger('cache');
                        },
                        underline: function(){
                            window.document.execCommand('underline');
                            eebe.trigger('cache');
                        },
                        strikethrough: function(){
                            window.document.execCommand('strikethrough');
                            eebe.trigger('cache');
                        },
                        subscript: function(){
                            window.document.execCommand('subscript');
                            eebe.trigger('cache');
                        },
                        superscript: function(){
                            window.document.execCommand('superscript');
                            eebe.trigger('cache');
                        }
                    }
                }, {
                    buttonNames: ['justifyleft', 'justifycenter', 'justifyright'],
                    type : 'text',
                    onClicks: {
                        justifyleft: function(){
                            window.document.execCommand('justifyleft');
                            eebe.trigger('cache');
                        },
                        justifycenter: function(){
                            window.document.execCommand('justifycenter');
                            eebe.trigger('cache');
                        },
                        justifyright: function(){
                            window.document.execCommand('justifyright');
                            eebe.trigger('cache');
                        },
                    }
                }, {
                    buttonNames: ['forecolor', 'hilitecolor'],
                    type : 'text',
                    onCreates: {
                        forecolor: function(){
                            var self = this;
                            var opts = {
                                'class': '',
                                palettePosition: 'outer',
                                color: '',
                                update: function(c){
                                    self.indicatorF.css('background-color', c);
                                },
                                change: function(c){
                                    self.setF(c);
                                    eebe.trigger('cache'); //缓存操作
                                }
                            };
                            
                            this.defaultFColor = '#000000';
                            this.elColorPicker(opts);
                            this.indicatorF = $('<div />').addClass('color-indicator').css('background-color', this.defaultFColor).prependTo(this);
                            
                            this.setF = function(c){
                                var nodes = eebe.selection.selected({
                                    filter: 'textContainsNodes'
                                }), css = 'color';
                                $.each(nodes, function(index, value){
                                    $this = $(value);
                                    $this.css(css, c).find('*').css(css, '');
                                });
                            }
                        },
                        hilitecolor: function(){
                            var self = this;
                            var opts = {
                                'class': '',
                                palettePosition: 'outer',
                                color: '',
                                update: function(c){
                                    self.indicatorBG.css('background-color', c);
                                },
                                change: function(c){
                                    self.setBG(c);
                                    eebe.trigger('cache'); //缓存操作
                                }
                            };
                            
                            this.defaultBGColor = '#ffffff';
                            this.elColorPicker(opts);
                            this.indicatorBG = $('<div />').addClass('color-indicator').css('background-color', this.defaultBGColor).prependTo(this);
                            
                            this.setBG = function(c){
                                var nodes = eebe.selection.selected({
                                    filter: 'textContainsNodes'
                                }), css = 'background-color';
                                $.each(nodes, function(index, value){
                                    $this = $(value);
                                    $this.css(css, c).find('*').css(css, '');
                                });
                            }
                        }
                    }
                }, {
                    buttonNames: ['fontsize', 'fontname', 'lineheight'],
                    type : 'text',
                    onCreates: {
                        fontsize: function(){
                            var self = this;
                            var sizeOpts = {
                                labelTpl: '%label',
                                tpl: '<span style="font-size:1;">%label</span>',
                                select: function(v){
                                    self.setSize(v);
                                    eebe.trigger('cache'); //缓存操作
                                },
                                src: {
                                    '0': '字体大小',
                                    '1': 'Small (8pt)',
                                    '2': 'Small (10px)',
                                    '3': 'Small (12pt)',
                                    '4': 'Normal (14pt)',
                                    '5': 'Large (18pt)',
                                    '6': 'Large (24pt)',
                                    '7': 'Large (36pt)'
                                }
                            }
                            this.sizeTable = {
                                '1': '8pt',
                                '2': '10px',
                                '3': '12pt',
                                '4': '14pt',
                                '5': '18pt',
                                '6': '24pt',
                                '7': '36pt'
                            }
                            this.elSelect(sizeOpts);
                            this.setSize = function(size){
                                var nodes = eebe.selection.selected({
                                    filter: 'textContainsNodes'
                                });
                                $.each(nodes, function(index, value){
                                    $this = $(value);
                                    $this.css('font-size', self.sizeTable[size]).find("[style]").css('font-size', self.sizeTable[size]);
                                });
                            }
                        },
                        fontname: function(){
                            var self = this;
                            var nameOpts = {
                                tpl: '<span style="font-family:%val">%label</span>',
                                select: function(v){
                                    self.setName(v);
                                    eebe.trigger('cache'); //缓存操作
                                },
                                src: {
                                    '': '字体',
                                    'FangSong_GB2312': '仿宋',
                                    'KaiTi_GB2312': '楷体',
                                    'SimHei': '黑体',
                                    'andale mono,sans-serif': 'Andale Mono',
                                    'arial,helvetica,sans-serif': 'Arial',
                                    'arial black,gadget,sans-serif': 'Arial Black',
                                    'book antiqua,palatino,sans-serif': 'Book Antiqua',
                                    'comic sans ms,cursive': 'Comic Sans MS',
                                    'courier new,courier,monospace': 'Courier New',
                                    'georgia,palatino,serif': 'Georgia',
                                    'helvetica,sans-serif': 'Helvetica',
                                    'impact,sans-serif': 'Impact',
                                    'lucida console,monaco,monospace': 'Lucida console',
                                    'lucida sans unicode,lucida grande,sans-serif': 'Lucida grande',
                                    'tahoma,sans-serif': 'Tahoma',
                                    'times new roman,times,serif': 'Times New Roman',
                                    'trebuchet ms,lucida grande,verdana,sans-serif': 'Trebuchet MS',
                                    'verdana,geneva,sans-serif': 'Verdana'
                                }
                            }
                            this.elSelect(nameOpts);
                            this.setName = function(size){
                                var nodes = eebe.selection.selected({
                                    filter: 'textContainsNodes'
                                });
                                $.each(nodes, function(index, value){
                                    $this = $(value);
                                    $this.css('font-family', size).find("[style]").css('font-family', '');
                                });
                            }
                        },
                        lineheight: function(){
                            var self = this;
                            var lineOpts = {
                                labelTpl: '%label',
                                tpl: '<span style="line-height:1;">%label</span>',
                                select: function(v){
                                    self.setLine(v);
                                    eebe.trigger('cache'); //缓存操作
                                },
                                src: {
                                    0: '行间距',
                                    '1': '1.0',
                                    '2': '1.5',
                                    '3': '2.0',
                                    '4': '2.5',
                                    '5': '3.0',
                                    '6': '3.5'
                                }
                            }
                            this.elSelect(lineOpts);
                            this.setLine = function(size){
                                var nodes = eebe.selection.selected({
                                    filter: 'textContainsNodes'
                                });
                                $.each(nodes, function(index, value){
                                    $this = $(value);
                                    $this.css('line-height', lineOpts.src[size]).find("[style]").css('line-height', '');
                                });
                            }
                        }
                    }
                }, {
                    buttonNames: ['outdent', 'indent'],
                    type : 'text',
                    onClicks: {
                        outdent: function(){
                            window.document.execCommand('outdent');
                            eebe.trigger('cache');
                        },
                        indent: function(){
                            window.document.execCommand('indent');
                            eebe.trigger('cache');
                        },
                    }
                }, {
                    buttonNames: ['removeformat'],
                    type : 'text',
                    onClicks: {
                        removeformat: function(){
                            var nodes = eebe.selection.selected({
                                filter: 'textContainsNodes'
                            });
                            $.each(nodes, function(index, value){
                                $this = $(value);
                                $this.removeAttr('style line-height font-family font-size background-color color');
                            });
                        }
                    }
                }, {
                    buttonNames: ['subcol1', 'subcol2', 'subcol3'],
                    type : 'text',
                    onClicks: {
                        subcol1: function(){
                            var columStyle = "dashed 2px gray";
                            var $currentPage = $('.page-text-layer', eebe.currentPage);
                            if ($('#subCol', $currentPage).length > 0) {
                                $('#subCol', $currentPage).removeAttr('style');
                            }
                        },
                        subcol2: function(){
                            var columStyle = "dashed 2px gray";
                            var $currentPage = $('.page-text-layer', eebe.currentPage);
                            if ($('#subCol', $currentPage).length > 0) {
                                $('#subCol', $currentPage).css({
                                    "-webkit-column-count": "2",
                                    "-moz-column-count": "2",
                                    "column-count": "2"
                                });
                            }
                            else {
                                var $rep = $("<div id = 'subCol'/>").css({
                                    "-webkit-column-count": "2",
                                    "-moz-column-count": "2",
                                    "column-count": "2",
                                    "-webkit-column-rule": columStyle,
                                    "-moz-column-rule": columStyle,
                                    "column-rule": columStyle
                                });
                                $currentPage.wrapInner($rep);
                            }
                        },
                        subcol3: function(){
                            var columStyle = "dashed 2px gray";
                            var $currentPage = $('.page-text-layer', eebe.currentPage);
                            if ($('#subCol', $currentPage).length > 0) {
                                $('#subCol', $currentPage).css({
                                    "-webkit-column-count": "3",
                                    "-moz-column-count": "3",
                                    "column-count": "3"
                                });
                            }
                            else {
                                var $rep = $("<div id = 'subCol'/>").css({
                                    "-webkit-column-count": "3",
                                    "-moz-column-count": "3",
                                    "column-count": "3",
                                    "-webkit-column-rule": columStyle,
                                    "-moz-column-rule": columStyle,
                                    "column-rule": columStyle
                                });
                                $currentPage.wrapInner($rep);
                            }
                        }
                    }
                }, ],
            }
        },
        
        GUID: function(){
            var guid = '';
            var i = 32;
            while (i--) {
                guid += Math.floor(Math.random() * 16.0).toString(16);
            }
            return guid;
        },
        
        px2Num: function(pxValue){
            if (pxValue == '' || pxValue == undefined) {
                return undefined;
            }
            pxValue = pxValue.replace('px', '');
            return parseInt(pxValue);
        },
        
        adjustImageSize: function(width, height, maxWidth, maxHeight){
            if (width > maxWidth) {
                height = height * (maxWidth / width);
                width = maxWidth;
                if (height > maxHeight) {
                    width = width * (maxHeight / height);
                    height = maxHeight;
                }
            }
            self.width(width).height(height);
        },
        
        mul:  function (arg1,arg2){   
		    var m=0,s1=arg1.toString(),s2=arg2.toString();   
		    try{m+=s1.split(".")[1].length}catch(e){}   
		    try{m+=s2.split(".")[1].length}catch(e){}   
		    return Number(s1.replace(".",""))*Number(s2.replace(".",""))/Math.pow(10,m)   
		}, 
  
		div: function (arg1,arg2){   
		    var t1=0,t2=0,r1,r2;   
		    try{t1=arg1.toString().split(".")[1].length}catch(e){}   
		    try{t2=arg2.toString().split(".")[1].length}catch(e){}   
		    with(Math){   
			    r1=Number(arg1.toString().replace(".",""))   
			    r2=Number(arg2.toString().replace(".",""))   
			    return (r1/r2)*pow(10,t2-t1);
		    }   
		}, 
    
    };
})(jQuery);
