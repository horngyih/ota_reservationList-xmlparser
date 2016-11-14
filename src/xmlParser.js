/* globals require, process */

var _fs = require( 'fs' );
var _readline = require( 'readline' );
var _xml2js = require( 'xml2js' );

var _hotelReservationProcessor = require( './hotelReservationProcessor' );

var args = process.argv.slice(2);

var xmlParserOptions = {
    'explicitArray' : false,
    'attrKey' : 'attr',
    'explicitRoot' : false
};

var processLimit = null;

if( args ){
  if( args.length > 0 ){
      
      if( args.length > 1 ){
          try{
              processLimit = parseInt( args[1] );
          }
          catch( error ){
              console.log( "Unable to read process limit number" );
              process.exit( -1 );
          }
      }
      
      var targetFile = args[0];
      var lineReader = _readline.createInterface({
          input: _fs.createReadStream( targetFile )
      });
      
      lineReader.on( 'line', processLine );
      lineReader.on( 'close', printReport );
  }
}

function exitParser( state ){
    printReport();
    process.exit( state );
}

var lineCounter = 0;
var crsidMap = {};

function processLine( line ){
    if( line ){
        lineCounter++;
        if( processLimit ){
            if( lineCounter > processLimit ){
                console.log( "Limit reached " + lineCounter + " - " + processLimit );
                exitParser( 0 );
            }
        }
        
        _xml2js.parseString( line, xmlParserOptions, function( err, result ){
            if( err ){
                console.log( err );
            }
            processResult( result );
        });
    }
}

var reportStatistics = {};

function printReport(){
    console.log( "Lines processed : " + lineCounter );
    for( var key in reportStatistics ){
        console.log( key + " read : " + reportStatistics[key] );
    }
}

function printResult( result ){
    var outputLine = "";
    for( var i in result ){
        var field = result[i];
        if( Array.isArray( field ) === true ){
            for( var j = 0; j < field.length; j++ ){
                var arrayField = field[j];
                if( outputLine.length > 1 ){
                    outputLine += ",";
                }
                outputLine += arrayField.value;
            }
        }
        else{
            if( outputLine.length > 1 ){
                outputLine += ",";
            }
            outputLine += field;
        }
    }
    outputLine += ",";
    console.log( outputLine );
}


function processResult( result ){
    if( result ){
        var hotelReservations = [];
        if( result.HotelReservation ){
            var hotelReservationElement = result.HotelReservation;
            if( Array.isArray( hotelReservationElement ) === true ){
                hotelReservations = hotelReservationElement;
            }
            else{
                 hotelReservations.push( hotelReservationElement );
            }
        }
        
        printResult( processHotelReservations( hotelReservations ) );
    }
}

function processHotelReservations( hotelReservations ){
    if( Array.isArray( hotelReservations ) ){
        for( var i = 0; i <  hotelReservations.length; i++ ){
            var hotelReservation = hotelReservations[i];
            incrementStatistics( 'hotelReservation' );
            
            var result = {};
            result.crsid = _hotelReservationProcessor.parseCrsID( hotelReservation );            
            if( result.crsid === null ){
                incrementStatistics( 'rejected' );
                incrementStatistics( 'rejected_NO_CRSID' );
                continue;
            }
            result.propertyCode = _hotelReservationProcessor.parsePropertyCode( hotelReservation );            
            if( result.propertyCode === null ){
                incrementStatistics( 'rejected' );
                incrementStatistics( 'rejected_NO_PROPERTYCODE' );
                continue;
            }
            result.resIDs = _hotelReservationProcessor.parseResIDS( hotelReservation );
            if( result.resIDs === null ){
                incrementStatistics( 'rejected' );
                incrementStatistics( 'rejected_NO_RESID' );
                continue;
            }
            
            if( crsidMap ){
                if( typeof crsidMap[result.crsid] === "undefined" ){
                    incrementStatistics( 'unique_crsid' );
                    crsidMap[result.crsid] = 1;
                }
                else
                {
                    continue;
                }
            }
            
            result.guestDetails = _hotelReservationProcessor.parseGuestDetails(hotelReservation);
            var stayDates = _hotelReservationProcessor.parseStayDates(hotelReservation );
            if( stayDates ){
                if( stayDates.checkInDate ){
                    result.checkInDate = stayDates.checkInDate;
                }
                
                if( stayDates.checkOutDate ){
                    result.checkOutDate = stayDates.checkOutDate;
                }
            }
            
            return( result );
        }
    }
}

function incrementStatistics( field ){
    if( reportStatistics ){
        if( reportStatistics[field] ){
            reportStatistics[field] += 1;
        }
        else{
            reportStatistics[field] = 1;
        }
    }
}