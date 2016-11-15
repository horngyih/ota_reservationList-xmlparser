/* globals module */

module.exports = {
    parseResIDS: function parseResIDs(hotelReservation) {
        var hotelReservationID, resID;
        var result = null;
        if (hotelReservation) {
            if (hotelReservation.ResGlobalInfo) {
                var resGlobalInfo = hotelReservation.ResGlobalInfo;
                if (resGlobalInfo.HotelReservationIDs) {
                    if (resGlobalInfo.HotelReservationIDs.HotelReservationID) {
                        var hotelReservationIDs = resGlobalInfo.HotelReservationIDs.HotelReservationID;
                        if (hotelReservationIDs) {
                            if (Array.isArray(hotelReservationIDs) === true) {
                                for (var i = 0; i < hotelReservationIDs.length; i++) {
                                    var hotelReservationIDElement = hotelReservationIDs[i];
                                    if (hotelReservationIDElement.$) {
                                        hotelReservationID = hotelReservationIDElement.$;
                                        resID = {};
                                        resID.resID = hotelReservationID.ResID_Value;
                                        resID.resIDType = hotelReservationID.ResID_Type;
                                        resID.value = resID.resID;

                                        if (resID.resID) {
                                            if (Array.isArray(result) === false) {
                                                result = [];
                                            }
                                            result.push(resID);
                                        }
                                    }
                                }
                            } else {
                                hotelReservationID = hotelReservationIDs.$;
                                resID = {};
                                resID.resID = hotelReservationID.ResID_Value;
                                resID.resIDType = hotelReservationID.ResID_Type;
                                resID.value = resID.resID;

                                if (resID.resID) {
                                    if (Array.isArray(result) === false) {
                                        result = [];
                                    }
                                    result.push(resID);
                                }
                            }
                        }
                    }
                }
            }
        }

        if (result === null) {
            //        console.log( hotelReservation );
        }

        return result;
    },
    parseCommentsCRSID: function parseCommentsCRSID(comment) {
        var result = null;
        if (comment) {
            if (comment.Text) {
                var commentText = comment.Text;
                var crsidPattern = /@@crsid=([0-9]+)@@/;
                var crisMatches = crsidPattern.exec(commentText);
                if (crisMatches) {
                    if (crisMatches.length > 1) {
                        result = crisMatches[1];
                    }
                }
            }
        }

        return result;
    },
    parseCrsID: function parseCrsID(hotelReservation) {
        var self = this;
        var comment;
        var result = null;
        if (hotelReservation) {
            var roomStays = hotelReservation.RoomStays;
            if (roomStays) {
                var roomStay = roomStays.RoomStay;
                if (roomStay) {
                    var comments = roomStay.Comments;
                    if (comments) {
                        if (Array.isArray(comments) === true) {
                            console.log( comments );
                            for (var i = 0; i < comments.length; i++) {
                                comment = comments[i];
                                result = self.parseCommentsCRSID(comment);
                            }
                        } else {
                            comment = comments.Comment;
                            result = self.parseCommentsCRSID(comment);
                        }
                    }
                    
                    if( result === null ){
//                        console.log( comments );
                    }
                }
            }
        }
        return result;
    },
    parsePropertyCode: function parsePropertyCode(hotelReservation) {
        var result = null;
        if (hotelReservation) {
            var roomStays = hotelReservation.RoomStays;
            if (roomStays) {
                var roomStay = roomStays.RoomStay;
                if (roomStay) {
                    if (roomStay.BasicPropertyInfo) {
                        if (roomStay.BasicPropertyInfo.$) {
                            var attr = roomStay.BasicPropertyInfo.$;
                            if (attr.HotelCode) {
                                result = attr.HotelCode;
                            }
                        }
                    }
                }
            }
        }
        return result;
    },
    parseGuestDetails : function parseGuestDetails(hotelReservation){
        var self = this;
        var result = [];
        if( hotelReservation ){
            var resGuests = hotelReservation.ResGuests;
            if( resGuests ){
                var resGuestElement = resGuests.ResGuest;
                var guestArray = [];
                if( Array.isArray( resGuestElement ) ){
                    guestArray = resGuestElement;
                }
                else{
                    guestArray.push( resGuestElement );
                }
                
                for( var i = 0; i < guestArray.length; i++ ){
                    var guestDetail = guestArray[i];
                    var profiles =[];
                    if( Array.isArray( guestDetail.Profiles ) ){
                        profiles = guestDetail.Profiles;
                    }
                    else{
                        profiles.push( guestDetail.Profiles );
                    }
                    
                    result = self.parseProfileInfos( profiles );
                }
            }
        }
        return result;
    },
    parseProfileInfos : function parseProfileInfos(profiles){
        var self = this;
        var result = [];
        if( Array.isArray( profiles ) ){
            for( var i = 0; i < profiles.length; i++ ){
                var profile = profiles[i].ProfileInfo;
                var guest = self.parseGuest( profile );
                if( guest !== null ){
                    result.push( guest );
                }
            }
        }
        return result;
    },
    parseGuest : function parseGuest( profile ){
        var result = null;
        if( profile ){
            if( profile.Profile ){
                result = {};
                if( profile.Profile.Customer ){
                    var customer = profile.Profile.Customer;
                    if( customer.PersonName ){
                        var personName = customer.PersonName;
                        result.nameTitle = personName.NamePrefix;
                        result.firstName = personName.GivenName;
                        result.lastName = personName.Surname;
                    }
                    
                    if( customer.Telephone ){
                        var telephone = customer.Telephone;
                        if( telephone.PhoneNumber ){                            
                            result.phoneNumber = telephone.PhoneNumber;
                        }
                        else{
                            result.phoneNumber = null;
                        }
                    }
                    
                    if( customer.Email ){
                        var email = customer.Email;
                        result.emailAddress = email;
                    }
                }
            }
        }
        return result;
    },
    parseStayDates : function parseStayDates(hotelReservation){
        var result = {};
        if( hotelReservation ){
            result.checkInDate = null;
            result.checkOutDate = null;
            if( hotelReservation.RoomStays ){
                if( hotelReservation.RoomStays.RoomStay ){
                    if( hotelReservation.RoomStays.RoomStay ){
                        var roomStay = hotelReservation.RoomStays.RoomStay;
                        var timeSpanElement = roomStay.TimeSpan;
                        if( timeSpanElement ){
                            var timeSpanAttr = timeSpanElement.$;
                            result.checkInDate = timeSpanAttr.Start;
                            result.checkOutDate = timeSpanAttr.End;
                        }
                    }
                }
            }
        }
        return result;
    }

};