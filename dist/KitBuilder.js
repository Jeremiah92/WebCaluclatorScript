// when the DOM is ready
$(document).ready(function() {

  const feetInput = jQuery('#Input-Feet');
  const inchInput = jQuery('#Input-Inches');
  var messages = jQuery('#Messages');
  const runButton = jQuery('#App-Run');

  runButton.click(event => {
  	//let feet = feetInput.val();
    //let inches = inchInput.val();
    //messages.text(`Run Length is ${feet} feet, ${inches} inches.`);
    
    //const ss = SpreadsheetApp.getActive();
    //const calculatorSheet = ss.getSheetByName('PART CALCULATOR');

    var gapDifference = 9999; //arbitrary high number
    var nearestGap;
    var nearestGapType;
    var panelNumNum;
    var pSpacing;
    var boardsPP;
    var postTotal;
    var boardTotal;
    //var messages = 'none';
    var previousGap;
    
    main();

    function main(){

      const sysTypePortrait = RegExp('Portrait')
      const sysTypeLandscape = RegExp('Landscape')
      const sysTypeClassic = RegExp('Classic')

      //gets all necessary input data from user
      const inputSettings = inputData();

      //checks to see which system type the user selected and runs the appropriate functions
      if(sysTypePortrait.test(inputSettings.systemType) === true ||sysTypeClassic.test(inputSettings.systemType) === true){

        verticalBoard(inputSettings);

        if(Number.isFinite(previousGap) === false){
        	console.log("isfinite ",Number.isFinite(previousGap))
          previousGap = nearestGap;
          console.log("Set previous Gap ",previousGap)
        }else{
          //do nothing
        }

      }else if(sysTypeLandscape.test(inputSettings.systemType) === true){
        console.log('Not Programmed')
      }else{
        console.log('false')
      }

      //Gathers the results from finding the best panel option
      //let finalSettings = [[messages],[pSpacing],[postTotal],[boardTotal],[panelNumNum],[boardsPP],[nearestGap],[nearestGapType]]

      //clears previous data and posts results
      //calculatorSheet.getRange('H3:H10').clearContent()
      //calculatorSheet.getRange('H3:H10').setValues(finalSettings)
      
      const pstSpacing = jQuery('#Post-Spacing');
      const numposts = jQuery('#Number-Of-Posts');
      const numboards = jQuery('#Number-Of-Boards')
      const numpanels = jQuery('#Number-Of-Panels');
      const bperpanel = jQuery('#Boards-Per-Panel');
      const gapSize= jQuery('#Gap-Size');
      const gapType = jQuery('#Gap-Type');
      //put the below items in input settings
      const kitNameInput = jQuery('#Run-Name-Input').val();
      const postColor = jQuery('#Frame-Color').val();
      const boardColor = jQuery('#Board-Color').val();
      
      const kitNameOutput = jQuery('#Run-Name');
      const postOutput = jQuery('#Part-Post');
      const boardOutput = jQuery('#Part-Board');
      
      kitNameOutput.text(`${kitNameInput}`)
      messages.text(`Run Length is ${feetInput.val()} feet, ${inchInput.val()} inches.`);
      pstSpacing.text(`${pSpacing}`);
      numposts.text(`${postTotal}`);
      numboards.text(`${boardTotal}`);
      numpanels.text(`${panelNumNum}`);
      bperpanel.text(`${boardsPP}`);
      gapSize.text(`${nearestGap}`);
      gapType.text(`${nearestGapType}`);
      postOutput.text(`4X4 Post - ${postColor}:`);
      boardOutput.text(`Standard Board - ${boardColor}:`);
      console.log("number of posts ", postTotal)
      
      //html embed for foxycart
      
      //const kitPrice = jQuery('#All-Variants .Variant')
      var colorSearch = RegExp('[^- ]+[\s\S]$')
      jQuery('#All-Variants .Variant').each(function(){
      		let boardName = $(this).find("board" + " - " + boardColor).text()
          let boardPrice = $(this).find(".variant-price").text()
          
          let postName = $(this).find("post" + " - " + postColor).text()
          let postPrice = $(this).find(".variant-price").text()
          
          if(boardColor == colorSearch.test(boardName)){
          	jQuery("#foxy-kitPrice").val(boardPrice * bperpanel * numpanels)
          }
      })
      jQuery('#foxy-kitName').val(kitNameOutput)
      jQuery('#foxy-runLength').val(`Run Length is ${feetInput.val()} feet, ${inchInput.val()} inches.`)

    };
    
    function inputData() {
      
      const sysTypeField = jQuery(`#System-Type-Selection`);
      const desiredGAP = jQuery(`#Desired-Gap`);

      //creates an object and assigns the appropriate values to each property
      let inputSettings = {};

      //**some of these properties may not be needed. Candidate for refactoring.
      inputSettings.runLength = parseFloat((feetInput.val()*12)) + parseFloat(inchInput.val());
      inputSettings.systemType = sysTypeField.val();
      //inputSettings.controlType = AI;
      inputSettings.gap = {
        max : 0.5,
        desired : parseFloat(desiredGAP.val())
      };
      inputSettings.postSpacing = {
        min : 6*12,
        max : 10*12,
        desired : 8*12,
        override : undefined
      }

      return inputSettings;
    };

    function verticalBoard(settings){

      const boardWidth = 5.5;
      const postWidth = 3.5;
      let gap;

      // runs a function that determines all panel options based on user input
      let panOptions = panelOptionBuild(settings,boardWidth,postWidth);

      //NOTE TO SELF. Number.isFinite is used to determine if a cell or property is empty. Works better that null, undefined or anything else
      console.log('desired ', Number.isFinite(settings.gap.desired))

      //determines what the target gap should be
        //Option 1 is a default value if no desired gap was set and the program has not been run previously
        //Option 2 will set the target gap specified by the user
        //Option 3 will set the target gap to the one determined on the previous run
      if(Number.isFinite(settings.gap.desired) === false && Number.isFinite(previousGap) === false){
        gap  = 0.1875
        console.log("Hard Set")
      }else if(Number.isFinite(settings.gap.desired) === true && Number.isFinite(previousGap) === false){
        gap = settings.gap.desired
        console.log("Taking input")
      }else if(Number.isFinite(previousGap) === true){
      	console.log("Program ran. Setting gap. ",gap)
        nearestGap = previousGap;
        gap = nearestGap;
      }
      //Runs a function that will pick the best option from the previously dermined list of options, based on the gap target.
      //Eventually the goal will be to determine the best option based on BOTH gap size AND post spacing.
      //console.log("panOptions",panOptions)
      bestPanelOption(panOptions,gap);

    };

    function panelOptionBuild(settings1,boardWidth1,postWidth1){

      //determines possible panel quantites based on post spacing range
      let minPanels = Math.floor(settings1.runLength/settings1.postSpacing.min);
      let maxPanels = Math.ceil(settings1.runLength/settings1.postSpacing.max);

      //creates an array of objects with each panel option being an object.
      //**some of these properties may not be needed. Candidate for refactoring.
      let panelOptions = [];

      for(i = maxPanels; i <= minPanels; i++) {
        let panelNum = i;
        let pstSpacing = settings1.runLength/i;
        let boards = Math.floor((pstSpacing - postWidth1)/boardWidth1)
        let rawGap = (pstSpacing - postWidth1) - (boards * boardWidth1)
        let panelOption = {
            panelOptionName : 'panel ' + panelNum,
            numberOfPanels : i,
            postSpacing : pstSpacing,
            betweenPosts : pstSpacing - postWidth1,
            boardsPerPanel : boards,
            excessSpace : rawGap,
            gapOptions : [
              {maxGaps : rawGap / (boards + 1)},
              {minGaps : rawGap / (boards - 1)},
              {maxGapReduceBoard : ((pstSpacing - postWidth1)-((boards-1)*boardWidth1))/((boards-1)+1)},
              {minGapReduceBoard : ((pstSpacing - postWidth1)-((boards-1)*boardWidth1))/((boards-1)-1)}
            ]
        };

        panelOptions.push(panelOption);

      };

      return panelOptions;
    };

    function bestPanelOption (panOptions1,gap1){
      //Iterates through all possible options and chooses the one that most closely matches the desired gap.
      //This will need to be altered to also consider post spacing and choose the option that best matches both.
      panOptions1.map(function (row,rowContents,array){
        row.gapOptions.map(function (row1,rowContents1,array1){
          //Object.entries is very interesting. It turns a key:value pair into an array that will allow you to access either the key or the value and do what you want with it.
          let objectArray = Object.entries(row1)
          let dgap = gap1

          //compares selected gap against desired gap to find the one that is closest to zero. If the selected option is closer than the currently stored option, the new option is assigned.
          if(Math.abs(dgap - objectArray[0][1]) < gapDifference){
            gapDifference = Math.abs(dgap - objectArray[0][1])
            nearestGap = objectArray[0][1]
            nearestGapType = objectArray[0][0]
            panelNumNum = row.numberOfPanels

            pSpacing = row.postSpacing/12
            boardsPP = row.boardsPerPanel
            postTotal = row.numberOfPanels //one short per run. Add one at the end of the order.
            boardTotal = row.boardsPerPanel * row.numberOfPanels
          }else{
            //console.log('skip')
          }
        })
      })
    };

    function errorHandler(){
      console.log('Woops!something went wrong.')
    }
    //resets the target gap for a new system.
    function newSystem(){
      previousGap = undefined;
    }
  });
});
