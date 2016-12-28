<<<<<<< HEAD
/*global define,dojo,Modernizr */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true */
=======
/*global Modernizr */
>>>>>>> origin/master
/*
 | Copyright 2014 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dom-class",
    "dojo/dom-attr",
    "dojo/query",
    "dojo/sniff",
    "dojo/topic",
    "dojo/on",
    "dojo/NodeList-dom",

    "application/lib/SvgHelper",

    "dijit/layout/ContentPane",

    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",

    "esri/urlUtils",

    "application/widgets/DynamicForm/DynamicForm",
    "application/widgets/PopupWindow/PopupWindow",

    "dojo/text!./ItemDetailsView.html"
], function (declare, lang, array, dom, domConstruct, domStyle, domClass, domAttr, query, has, topic, on, nld,
    SvgHelper,
    ContentPane,
    _WidgetBase, _TemplatedMixin,
    urlUtils,
    DynamicForm, PopupWindow,
    template) {

    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,

        /**
         * Constructor for class.
         * @param {object} appConfig App configuration object; see subclass for required parameter(s)
         * @memberOf social#
         * @constructor
         */
        constructor: function () {
            this.id = "itemDetail";
            this.baseClass = "itemDetail";
            this.itemTitle = "default title";
            this.itemVotes = null;
            this.actionVisibilities = {
                "showVotes": false,
                "showComments": false,
                "showGallery": false
            };
            this.votesField = null;
            this.commentFields = null;
            this.votedItemList = [];
            //this._likeButtonClickHandler = null;
        },

        /**
         * Widget post-create, called automatically in widget creation
         * life cycle, after constructor. Sets class variables.
         */
        postCreate: function () {
            this.inherited(arguments);
            this.i18n = this.appConfig.i18n.item_details;
            this.initCommentsDiv();
            this.initContentPane();
            this.hide();
        },

        /**
         * Adds icons and listener setup to custom post-DOM-creation steps.
         */
        startup: function () {
            this.inherited(arguments);
            this.initTemplateIcons();
            this.addListeners();
        },

        /**
         * Shows the widget and, if permitted and possible, the votes and comments
         * buttons and areas.
         */
        show: function () {
            if (!this.actionVisibilities.showVotes || !this.votesField) {
                domStyle.set(this.likeButton, "display", "none");
                domStyle.set(this.itemVotesGroup, "display", "none");
            }
            if (!this.actionVisibilities.showComments || !this.commentFields) {
                domStyle.set(this.commentButton, "display", "none");
                domStyle.set(this.commentsHeading, "display", "none");
                domStyle.set(this.noCommentsDiv, "display", "none");
                domStyle.set(this.commentsList, "display", "none");
            }
            domStyle.set(this.domNode, "display", "");

            // Scroll to the top of the details; needed for Firefox
            this.scrollIntoView(this.descriptionDiv);
        },

        /**
         * Hides the widget with a simple display: "none"
         */
        hide: function () {
            domStyle.set(this.domNode, "display", "none");
            this.destroyCommentForm();
        },

        /**
         * Creates the icons for the Like, Comment, Gallery buttons and gives them their
         * i18n labels and tooltips.
         * <br>Needs to be run after postCreate, such as in startup, because of SVG icons; see
         * https://code.google.com/p/tatami/issues/detail?id=40
         */
        initTemplateIcons: function () {
            var backIconSurface;

            backIconSurface = SvgHelper.createSVGItem(this.appConfig.backIcon, this.backIcon, 12, 20);
            if (!Modernizr.rgba) {
                SvgHelper.changeColor(backIconSurface, this.appConfig.theme.foreground);
            }

            //SvgHelper.createSVGItem(this.appConfig.likeIcon, this.itemVotesIcon, 12, 12);

            //domAttr.set(this.likeIcon, "src", "images/likeBlue.png");
            //domAttr.set(this.likeButton, "title", this.i18n.likeButtonTooltip);

            domAttr.set(this.commentIcon, "src", "images/commentBlue.png");
            domAttr.set(this.commentButton, "title", this.i18n.commentButtonTooltip);

            domAttr.set(this.mapIcon, "src", "images/mapmarkerBlue.png");
            domAttr.set(this.mapButton, "title", this.i18n.gotoMapViewTooltip);

            domAttr.set(this.galleryIcon, "src", "images/galleryBlue.png");
            domAttr.set(this.galleryButton, "title", this.i18n.galleryButtonTooltip);
        },

        /**
         * Sets the invert state of a button.
         * @param {string} pngTag The unique part of the button PNG image file corresponding to
         * the button, e.g., "like", "comment", "gallery"
         * @param {boolean} toInvert Whether button should be shown in inverted state (true) or not
         * @param {object} button The button to modify
         * @param {object} icon The icon img in the button
         * @param {object} tooltip Whether like button's tooltip should be changed or not
         */
        invertButton: function (pngTag, toInvert, button, icon, tooltip) {
            if (toInvert) {
                domClass.remove(button, "btnNormal");
                domClass.add(button, "btnInverse");
                domAttr.set(icon, "src", "images/" + pngTag + "White.png");
            }
            else {
                domClass.remove(button, "btnInverse");
                domClass.add(button, "btnNormal");
                domAttr.set(icon, "src", "images/" + pngTag + "Blue.png");
            }
            if (tooltip) {
                domAttr.set(button, "title", tooltip);
            }
        },

        /**
         * Sets up the i18n comments-list heading and the no-comments planceholder.
         */
        initCommentsDiv: function () {
            this.commentsHeading.innerHTML = this.i18n.commentsListHeading;
            this.noCommentsDiv.innerHTML = this.i18n.noCommentsPlaceholder;
        },

        /**
         * Sets up the click listeners for widget's buttons.
         */
        addListeners: function () {
            var self = this;
            this.own(
                on(this.backIcon, "click", function () {
                    topic.publish("detailsCancel");
                }),
                on(this.commentButton, "click", function () {
                    topic.publish("getComment", self.item);
                }),
                on(this.mapButton, "click", function () {
                    topic.publish("showMapViewClicked");
                }),
                on(this.galleryButton, "click", lang.hitch(this, function () {
                    topic.publish("showGallery", self.item);
                    if (domStyle.get(this.gallery, "display") === "none") {
                        this.showGallery();
                    }
                    else {
                        this.hideGallery();
                    }
                }))
            );
        },

        /**
         * Sets the fields that are needed to display feature information in this list (number of votes).
         * Needs to be called before first setItems to tell the widget which fields to look for.
         * @param {string} votesField Name of votes property
         * @param {array} commentFields Fields used by comment-entry form
         */
        setItemFields: function (votesField, commentFields) {
            this.votesField = votesField;
            this.commentFields = commentFields;
        },

        /**
         * Sets the permitted visibility of the votes, comments, and gallery buttons.
         * @param {boolean} showVotes Display button if the votes field is known
         * @param {boolean} showComments Display button if the comments fields are known
         * @param {boolean} showGallery Display button if current item has attachments
         */
        setActionsVisibility: function (showVotes, showComments, showGallery) {
            this.actionVisibilities = {
                "showVotes": showVotes,
                "showComments": showComments,
                "showGallery": showGallery
            };
        },

        /**
         * Creates the div to hold the current item's popup.
         */
        initContentPane: function () {
            this.itemCP = new ContentPane({
                id: "itemCP"
            }, this.descriptionDiv);
            this.itemCP.startup();
        },

        /**
         * Clears the display, sets the current item, and creates its display.
         * @param {object} item Item to become the current display item
         * Checks if the item is already voted; if yes like button's color and tooltip is changed
         * else a vote is registered and button's color, tooltip is changed. Then the event handler is removed.
         */
        setItem: function (item) {
            this.item = item;
            this.clearGallery();

            this.itemTitle = this.getItemTitle(item) || "&nbsp;";
            //this.itemVotes = this.getItemVotes(item);
            this.clearItemDisplay();
            this.buildItemDisplay();

            var objectId = item.attributes[item._layer.objectIdField];

            /*if (this._likeButtonClickHandler) {
                this._likeButtonClickHandler.remove();
                this._likeButtonClickHandler = null;
            }

            if (array.indexOf(this.votedItemList, objectId) > -1) {
                this.invertButton("like", true, this.likeButton, this.likeIcon, this.i18n.likeButtonInverseTooltip);

            }
            else {
                this._likeButtonClickHandler = on(this.likeButton, "click", lang.hitch(this, function () {
                    var objectId = this.item.attributes[this.item._layer.objectIdField];

                    if (array.indexOf(this.votedItemList, objectId) === -1) {
                        topic.publish("addLike", this.item);
                        this.votedItemList.push(objectId);
                        this.invertButton("like", true, this.likeButton, this.likeIcon, this.i18n.likeButtonInverseTooltip);
                        this._likeButtonClickHandler.remove();
                        this._likeButtonClickHandler = null;
                    }
                }));

                this.invertButton("like", false, this.likeButton, this.likeIcon, this.i18n.likeButtonTooltip);
            }*/

        },

        /**
         * Updates the votes display of the current item.
         * @param {object} item Updated definition of current item; if it does not have
         * the same object id as the current item, nothing happens
         */
        
        /*updateItemVotes: function (item) {
            if (item.attributes[item._layer.objectIdField] === this.item.attributes[this.item._layer.objectIdField]) {
                this.itemVotes = this.getItemVotes(item);
                this.redrawItemVotes();
            }
        },*/

        /**
         * Updates the contents of the votes display div, including applying a class to get a bit
         * more space if needed; hides votes display if votes field is not known.
         */
<<<<<<< HEAD
        // redrawItemVotes: function () {
        //     if (this.itemVotes) {
        //         if (this.itemVotes.needSpace) {
        //             domClass.add(this.itemTitleDiv, "itemDetailTitleOverride");
        //         }
        //         this.itemVotesDiv.innerHTML = this.itemVotes.label;
        //     } else {
        //         domStyle.set(this.itemVotesGroup, 'display', 'none');
        //     }
        // },
=======
        redrawItemVotes: function () {
            if (this.itemVotes) {
                if (this.itemVotes.needSpace) {
                    domClass.add(this.itemTitleDiv, "itemDetailTitleOverride");
                }
                this.itemVotesDiv.innerHTML = this.itemVotes.label;
            }
            else {
                domStyle.set(this.itemVotesGroup, "display", "none");
            }
        },
>>>>>>> origin/master

        /**
         * Shows the attachments for the current item if there are any and it is permitted;
         * hides the gallery button otherwise.
         * @param {array} attachments List of attachments for item
         */
        setCurrentItemAttachments: function (attachments) {
            var showGalleryButton =
                this.actionVisibilities.showGallery && attachments && attachments.length > 0;
            if (showGalleryButton) {
                this.setAttachments(this.gallery, attachments);
                domStyle.set(this.galleryButton, "display", "inline-block");
            }
        },

        /**
         * Shows the attachments for the current item if there are any and it is permitted;
         * hides the gallery button otherwise.
         * @param {object} gallery DOM container for attachments
         * @param {array} attachments List of attachments for item
         */
        setAttachments: function (gallery, attachments) {
            if (!this.enlargedViewPopup) {
                // Popup window for enlarged image
                this.enlargedViewPopup = new PopupWindow({
                    "appConfig": this.appConfig,
                    "showClose": true
                }).placeAt(document.body); // placeAt triggers a startup call to _helpDialogContainer
            }

            this.updateGallery(gallery, attachments);
        },

        /**
         * Adds the specified attachments to the item's gallery.
         * @param {object} gallery DOM container for attachments
         * @param {array} attachments List of attachments for item
         */
        updateGallery: function (gallery, attachments) {
            // Create gallery

            array.forEach(attachments, lang.hitch(this, function (attachment) {
                var urlsplit, thumb, srcURL, attachmentUrl;

                if (attachment.contentType === "image/jpeg" || attachment.contentType === "image/png") {
                    urlsplit = attachment.url.split("?");
                    if (urlsplit.length > 1) {
                        srcURL = urlsplit[0] + "/" + attachment.name + "?" + urlsplit[1];
                    }
                    else {
                        srcURL = urlsplit[0] + "/" + attachment.name;
                    }
                    thumb = domConstruct.create("img", {
                        "class": "attachment",
                        "title": attachment.name,
                        "src": srcURL
                    }, gallery);
                    this.own(on(thumb, "click", lang.hitch(this, function (attachment) {
                        domConstruct.empty(this.enlargedViewPopup.popupContent);
                        var imgContainer = domConstruct.create("div", {
                            "class": "popupImgContent"
                        }, this.enlargedViewPopup.popupContent);
                        domConstruct.create("img", {
                            "class": "attachment",
                            "src": srcURL
                        }, imgContainer);
                        this.enlargedViewPopup.show();
                    })));

                }
                else if (attachment.contentType === "application/pdf") {
                    thumb = domConstruct.create("img", {
                        "class": "attachment",
                        "title": attachment.name,
                        "src": "images/pdficon_large.png"
                    }, gallery);
                    attachmentUrl = attachment.url;
                    this.own(on(thumb, "click", lang.hitch(this, function () {
                        window.open(attachmentUrl, "_blank");
                    })));

                }
                else if (attachment.url && attachment.url.length > 0) {
                    thumb = domConstruct.create("img", {
                        "class": "attachment",
                        "title": attachment.name,
                        "src": "images/file_wht.png"
                    }, gallery);
                    attachmentUrl = attachment.url;
                    this.own(on(thumb, "click", lang.hitch(this, function () {
                        window.open(attachmentUrl, "_blank");
                    })));
                }

            }));
        },

        /**
         * Clears the gallery.
         */
        clearGallery: function () {
            domStyle.set(this.galleryButton, "display", "none");
            this.hideGallery();
            domConstruct.empty(this.gallery);
        },

        /**
         * Makes the gallery visible.
         */
        showGallery: function () {
            domStyle.set(this.gallery, "display", "block");
            this.invertButton("gallery", true, this.galleryButton, this.galleryIcon);
        },

        /**
         * Hides the gallery.
         */
        hideGallery: function () {
            domStyle.set(this.gallery, "display", "none");
            this.invertButton("gallery", false, this.galleryButton, this.galleryIcon);
        },

        /**
         * Creates the comment form anew and makes it visible.
         * @param {object} [userInfo] User social-media sign-in info, of which function uses the "name" attribute
         * to pre-populate the comment name field if one is configured in the app's commentNameField attribute
         */
        showCommentForm: function (userInfo) {
            if (this.commentFields) {
                if (!this.itemAddComment) {
                    // Create comment form
                    this.itemAddComment = new DynamicForm({
                        "appConfig": this.appConfig
                    }).placeAt(this.commentsForm); // placeAt triggers a startup call to itemAddComment

                    // Set its item and its fields
                    this.itemAddComment.setItem(this.item);
                    this.itemAddComment.setFields(this.commentFields);

                    // See if we can pre-set its user name value
                    if (userInfo && userInfo.name && this.appConfig.commentNameField && this.appConfig.commentNameField.length > 0) {
                        this.itemAddComment.presetFieldValue(this.appConfig.commentNameField, userInfo.name);
                    }
                }

                // Show the form
                this.itemAddComment.show();
                this.invertButton("comment", true, this.commentButton, this.commentIcon);

                // Scroll the comment form into view if needed
                this.scrollIntoView(this.itemAddComment.domNode);
            }
        },

        /**
         * Destroys the comment form.
         */
        destroyCommentForm: function () {
            if (this.itemAddComment) {
                this.itemAddComment.destroy();
                this.itemAddComment = null;
                this.invertButton("comment", false, this.commentButton, this.commentIcon);

                // Scroll to the top of the details to restore context
                this.scrollIntoView(this.descriptionDiv);
            }
        },

        /**
         * Scrolls a container node to make a specified node visible.
         * @param {object} nodeToMakeVisible Node that's to be brought into view
         */
        scrollIntoView: function (nodeToMakeVisible) {
            // Firefox defaults to former scroll position if we're returning to a previously-scrolled node (which could
            // be a different item's details--they go into the same scrollable div). The scrollIntoView can't change this
            // unless it occurs a little later than the default behavior, hence the setTimeout.
            if (!has("ff")) {
                nodeToMakeVisible.scrollIntoView();
            }
            else {
                setTimeout(function () {
                    nodeToMakeVisible.scrollIntoView();
                }, 500);
            }
        },

        /**
         * Gets title of feature for header display
         * @param  {feature} item The feature for which to get the title
         * @return {string}      The title of the feature
         */
        getItemTitle: function (item) {
            return item.getTitle ? this.stripTags(item.getTitle()) : "";
        },

        /**
         * Removes HTML tags from a string
         * @param {string} str String possibly containing HTML tags
         * @return {string} Cleaned string
         * @see http://dojo-toolkit.33424.n3.nabble.com/Stripping-HTML-tags-from-a-string-tp3999505p3999576.html
         */
        stripTags: function (str) {
            return domConstruct.create("div", {
                innerHTML: str
            }).textContent;
        },

        /**
         * Gets the number of votes for an item
         * @param  {feature} item The feature for which to get the vote count
         * @return {null|object} Object containing "label" with vote count for the item in a shortened form
         * (num if <1000, floor(count/1000)+"k" if <1M, floor(count/1000000)+"M" otherwise) and "needSpace"
         * that's indicates if an extra digit of room is needed to handle numbers between 99K and 1M, exclusive;
         * returns null if the feature layer's votes field is unknown
         */
<<<<<<< HEAD
        // getItemVotes: function (item) {
        //     var needSpace = false, votes;

        //     if (this.votesField) {
        //         votes = item.attributes[this.votesField] || 0;
        //         if (votes > 999) {
        //             if (votes > 99999) {
        //                 needSpace = true;
        //             }
        //             if (votes > 999999) {
        //                 votes = Math.floor(votes / 1000000) + "M";
        //             } else {
        //                 votes = Math.floor(votes / 1000) + "k";
        //             }
        //         }
        //         return {
        //             "label": votes,
        //             "needSpace": needSpace
        //         };
        //     }
        //     return null;
        // },
=======
        getItemVotes: function (item) {
            var needSpace = false,
                votes;

            if (this.votesField) {
                votes = item.attributes[this.votesField] || 0;
                if (votes > 999) {
                    if (votes > 99999) {
                        needSpace = true;
                    }
                    if (votes > 999999) {
                        votes = Math.floor(votes / 1000000) + "M";
                    }
                    else {
                        votes = Math.floor(votes / 1000) + "k";
                    }
                }
                return {
                    "label": votes,
                    "needSpace": needSpace
                };
            }
            return null;
        },
>>>>>>> origin/master

        /**
         * Completely clears the display for the current item.
         */
        clearItemDisplay: function () {
<<<<<<< HEAD
            //this.itemTitleDiv.innerHTML = '';
            //this.itemVotesDiv.innerHTML = '';
            this.itemCP.set('content', '');
=======
            this.itemTitleDiv.innerHTML = "";
            this.itemVotesDiv.innerHTML = "";
            this.itemCP.set("content", "");
>>>>>>> origin/master
        },

        /**
         * Builds the display for the current item.
         */
        buildItemDisplay: function () {
            this.itemTitleDiv.innerHTML = this.itemTitle;
<<<<<<< HEAD
            //this.redrawItemVotes();
            this.itemCP.set('content', this.item.getContent());
=======
            this.redrawItemVotes();
            this.itemCP.set("content", this.item.getContent());
>>>>>>> origin/master
        },

        /**
         * Clears the comments display and builds a new one based upon the supplied list.
         * @param {array} commentsArr List of comment objects
         */
        setComments: function (commentsArr) {
            this.clearComments();
            domClass.toggle(this.noCommentsDiv, "hide", commentsArr.length);
            array.forEach(commentsArr, lang.hitch(this, this.buildCommentDiv));
        },

        /**
         * Creates a ContentPane to hold the contents of a comment.
         * @param {object} comment Comment to display; its contents come from calling
         * getContent() on it
         */
        buildCommentDiv: function (comment) {
            var commentDiv, attachmentsDiv;

            commentDiv = domConstruct.create("div", {
                "class": "comment"
            }, this.commentsList);

            new ContentPane({
                "class": "content small-text",
                "content": comment.getContent()
            }, commentDiv).startup();

            if (comment._layer.hasAttachments) {
                attachmentsDiv = domConstruct.create("div", {
                    "class": "attachmentsSection2"
                }, commentDiv);

                comment._layer.queryAttachmentInfos(comment.attributes[comment._layer.objectIdField],
                    lang.hitch(this, function (attachments) {
                        this.setAttachments(attachmentsDiv, attachments);
                    }),
                    function (error) {
                        console.log(error);
                    }
                );
            }
        },

        /**
         * Empties the list of comments.
         */
        clearComments: function () {
            domConstruct.empty(this.commentsList);
        }
    });
});
