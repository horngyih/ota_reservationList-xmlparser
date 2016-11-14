/* globals require, process, xml2js */

var _fs = require('fs');
var _readline = require('readline');
var _xml2js = require('xml2js');

var args = process.argv.slice(2);

var outputStream = null;
var processLimit = null;

var crsidPattern = /@@crsid=([0-9]+)@@/;

var unparsedList = [];
var parsedList = [];
var linesRead = 0;
var hotelReservationCount = 0;

if (args.length >= 0) {
    var targetFile = args[0];
    var lineReader = _readline.createInterface({
        input: _fs.createReadStream(targetFile)
    });
    lineReader.on('line', processLine);
    lineReader.on( 'close', printReport );
    console.log( "PropertyCode, ResvID, GuestID, ConfirmationNumber" );

    var outputFile = 'output.csv';
    if (args.length > 1) {
        outputFile = args[1];
    }
    outputStream = _fs.createWriteStream(outputFile);

    if (args.length > 2) {
        try {
            processLimit = parseInt(args[2]);
        } catch (error) {
            processLimit = 1;
        }
    }

}

var processCounter = 0;

var xmlParserOpts = {
    explicitArray : false
};

function printResults(){
}

function printReport(){
    console.log( "Lines read : " + linesRead );
    
    if( Array.isArray( parsedList ) ){
        console.log( "Parsed : " + parsedList.length );
    }
    
    if( Array.isArray( unparsedList ) ){
        console.log( "Unparsed: "  + unparsedList.length );
    }
    
    console.log( "HotelReservations parsed : " + hotelReservationCount );
}

function processLine(line) {
    linesRead++;
    if (line) {
        if (processLimit !== null) {
            if (processCounter >= processLimit) {
                process.exit(1);
            }
        }

        var wrappedLine = "<root>";
        wrappedLine += line;
        wrappedLine += "</root>";

        _xml2js.parseString(wrappedLine, xmlParserOpts, processObject);
    }
}

function processObject(err, obj) {
    if (!err) {
        processCounter++;
        if (obj) {
            var reservationsList = obj.root.ReservationsList;
            if (reservationsList) {
                parseReservationsList(reservationsList);
            }
        }
    }
}

function parseReservationsList(reservationsList) {
    var parsed;
    if( Array.isArray( reservationsList ) ){
        for (var i = 0; i < reservationsList.length; i++) {
            var hotelReservations = reservationsList[i].HotelReservation;
            for (var x = 0; x < hotelReservations.length; x++) {
                parsed = parseHotelReservation(hotelReservations[x]);
                if( parsedList === null ){
                    parsedList = [];
                }                
                parsedList.push( parsed );
            }
        }
    }
    else{        
        parsed = parseHotelReservation( reservationsList.HotelReservation );
        if( typeof parsed.crsid !== "undefined" ){
            if( parsedList === null ){
                parsedList = [];
            }
            parsedList.push( parsed );
            var outputLine = "";
            outputLine += parsed.propertyCode;
            outputLine += ",";
            outputLine += parsed.crsid;
            if( Array.isArray( parsed.resIDs ) ){
                var resIDs = parsed.resIDs;
                for( var i = 0; i < resIDs.length; i++ ){
                    outputLine += ",";
                    outputLine += resIDs[i].resvID;
    //                outputLine += '|';
    //                outputLine += resIDs[i].resvIDType;
                }
            }
            console.log( outputLine );
            if(outputStream ){
            }
        }
        else{
            if( !Array.isArray( unparsedList  ) ){
                unparsedList = [];
            }
            unparsedList.push( reservationsList.HotelReservation );
        }
    }
}

function parseHotelReservation(hotelReservation) {
    var result = {};
    if (hotelReservation) {
        hotelReservationCount++;
        if( hotelReservation.RoomStays ){
            var roomStays = hotelReservation.RoomStays;
            result = parseRoomStays( roomStays );
        }
        
        if( hotelReservation.ResGlobalInfo ){
            var resGlobalInfo = hotelReservation.ResGlobalInfo;
            if( resGlobalInfo.HotelReservationIDs ){
                result.resIDs = paresHotelReservationIDs( resGlobalInfo.HotelReservationIDs.HotelReservationID );
                
            }
        }
    }
    return result;
}

function paresHotelReservationIDs( hotelReservationIDs ){
    var result = [];
    if( Array.isArray( hotelReservationIDs ) ){
       for( var i = 0; i < hotelReservationIDs.length; i++ ){
           var hotelReservationID = hotelReservationIDs[i];
           if( hotelReservationID.$ ){
               var attr = hotelReservationID.$;
               result.push( { 'resvID' : attr.ResID_Value, 'resvIDType' : attr.ResID_Type } );
           }
       }
    }
    return result;
}

function parseRoomStays( roomStays ){
    if( roomStays ){
        if( Array.isArray( roomStays ) ){
           for( var i = 0; i < roomStays.length; i++  ){
                var roomStayElement = roomStays[i];
                if( roomStayElement.RoomStay ){
                    return parseRoomStay( roomStayElement.RoomStay );
                }
            }
        }
        else{
            return parseRoomStay( roomStays.RoomStay );
        }
    }
}

function parseRoomStay( roomStay ){
    var result = {};
    if( roomStay ){
        result.propertyCode = parseBasicPropertyInfo( roomStay.BasicPropertyInfo );
        result.crsid = parseComments( roomStay.Comments );
    }
    return result;
}

function parseBasicPropertyInfo( propertyInfo ){
    if( propertyInfo ){
        var attr = propertyInfo.$;
        if( attr.HotelCode ){
            return attr.HotelCode;
        }
    }
}

function parseComments( comments ){
    if( comments ){
        if( Array.isArray( comments ) ){
            for( var i = 0; i < comments.Comment.length; i++ ){
                return parseComment( comments.Comment[i] );
            }
        }
        else{
            return parseComment( comments.Comment );
        }
    }
}

function parseComment( comment ){
    if( comment ){
        var matchedCrsid = crsidPattern.exec( comment.Text );
        if( matchedCrsid && matchedCrsid.length > 1 ){
            return matchedCrsid[1];
        }
    }
}