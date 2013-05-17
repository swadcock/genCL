-- BMD Database
-- Take the contents of the BMD_Import table, and reformat into something more 
--   suitable for the MODS format
--   BMD_Import contents are copy-pasted from "BMD Certificates.doc"


DROP TABLE BMD_Certificates

DROP TABLE Items

CREATE TABLE Items
  ( Item_ID             Short Primary Key,
    Item_Type           Character varying(20),
    Purchased           DateTime,
    Physical_Location   Character varying(100),
    subLocation         Character varying(100),
    shelfLocator        Character varying(100),
    Identifier          Character varying(100),
    Digital_File        Character varying(250),
    URL                 Character varying(250)
  )

ALTER TABLE Items
   ADD CONSTRAINT FK01_Items
   FOREIGN KEY (Item_Type) 
   REFERENCES Item_Types (Item_Type) 

CREATE TABLE BMD_Certificates
  ( Item_ID             Short Primary Key,
    Item_Type           Character varying(20),
    Gender              Character(2),
    Surname_1           Character varying(20),
    GivenNames_1        Character varying(30),
    Surname_2           Character varying(20),
    GivenNames_2        Character varying(30),
    Marriage_Type       Character varying(20),
    Marriage_Date       DateTime,
    Location            Character varying(30),
    Reg_Authority       Character varying(50),
    Reg_District        Character varying(30),
    Index_Quarter       Character varying(15),
    Index_Year          Short,
    Index_Volume        Character varying(5),
    Index_Page          Character varying(5),
    Notes               Character varying(250)
  )

ALTER TABLE BMD_Certificates
   ADD CONSTRAINT FK01_BMD_Certificates
   FOREIGN KEY (Item_ID) 
   REFERENCES Items (Item_ID) 

ALTER TABLE BMD_Certificates
   ADD CONSTRAINT FK02_BMD_Certificates
   FOREIGN KEY (Item_Type) 
   REFERENCES Item_Types (Item_Type) 

DROP TABLE MODS_Export_BMD

CREATE TABLE MODS_Export_BMD
  ( Item_ID             Short Primary Key,
    Item_Type           Character varying(20),
    Doc_Type            Character varying(40),
    Doc_Type_Short      Character varying(20),
    Purchased           DateTime,
    Physical_Location   Character varying(100),
    subLocation         Character varying(100),
    shelfLocator        Character varying(100),
    Identifier          Character varying(100),
    Digital_File        Character varying(250),
    URL                 Character varying(250),
    Gender              Character(2),
    Surname_1           Character varying(20),
    GivenNames_1        Character varying(30),
    Surname_2           Character varying(20),
    GivenNames_2        Character varying(30),
    Marriage_Type       Character varying(20),
    Marriage_Date       DateTime,
    Location            Character varying(30),
    Reg_Authority       Character varying(50),
    Reg_District        Character varying(30),
    Index_Quarter       Character varying(15),
    Index_Year          Short,
    Index_Volume        Character varying(5),
    Index_Page          Character varying(5),
    Notes               Character varying(250)
  )

DROP TABLE _a1

CREATE TABLE _a1
  ( Item_ID             Integer Identity Primary Key,
    Certificate_Type    Character varying(20),
    Gender              Character varying(5),
    ID                  Short,
    Purchased           DateTime,
    Country             Character varying(20),
    Certificate_Year    Short,
    Surname_1           Character varying(20),
    GivenNames_1        Character varying(30),
    Surname_2           Character varying(20),
    GivenNames_2        Character varying(30),
    Notes               Character varying(100),
    Identifier          Character varying(100),
    Digital_File        Character varying(250),
    URL                 Character varying(250)
  )

INSERT INTO _a1 ( Certificate_Type, Gender,
    ID, Purchased, Country, Certificate_Year,
    Surname_1, GivenNames_1, Surname_2, GivenNames_2,
    Notes )
  SELECT Certificate_Type, Gender,
    ID, Purchased, Country, Certificate_Year,
    Surname_Person_1, Given_Names_Person_1,
    Surname_Person_2, Given_Names_Person_2, Notes
  FROM BMD_Import
  WHERE Gender <> 'F-M'
  ORDER BY Purchased, Certificate_Type, ID        

INSERT INTO Items ( Item_ID )
  SELECT Item_ID
  FROM _a1

UPDATE Items
  SET Items.Item_Type = 'GRO-Marriage',
      Items.shelfLocator = 'Marriage Certificates Binder'
  FROM Items INNER JOIN _a1
    ON Items.Item_ID = [_a1].Item_ID
  WHERE [_a1].Certificate_Type = 'Marriage'
    AND [_a1].Country = 'England'

UPDATE Items
  SET Items.Item_Type = 'GRO-Birth',
      Items.shelfLocator = 'Birth Certificates Binder'
  FROM Items INNER JOIN _a1
    ON Items.Item_ID = [_a1].Item_ID
  WHERE [_a1].Certificate_Type = 'Birth'
    AND [_a1].Country = 'England'

UPDATE Items
  SET Items.Item_Type = 'GRO-Death',
      Items.shelfLocator = 'Death Certificates Binder'
  FROM Items INNER JOIN _a1
    ON Items.Item_ID = [_a1].Item_ID
  WHERE [_a1].Certificate_Type = 'Death'
    AND [_a1].Country = 'England'

UPDATE Items
  SET Items.Item_Type = 'Marr-Scotland',
      Items.shelfLocator = 'Marriage Certificates Binder'
  FROM Items INNER JOIN _a1
    ON Items.Item_ID = [_a1].Item_ID
  WHERE [_a1].Certificate_Type = 'Marriage'
    AND [_a1].Country = 'Scotland'

UPDATE Items
  SET Items.Item_Type = 'Marr-MB',
      Items.shelfLocator = 'Marriage Certificates Binder'
  FROM Items INNER JOIN _a1
    ON Items.Item_ID = [_a1].Item_ID
  WHERE [_a1].Certificate_Type = 'Marriage'
    AND [_a1].Country = 'Manitoba'

UPDATE Items
  SET Items.Purchased = [_a1].Purchased
  FROM Items INNER JOIN _a1
    ON Items.Item_ID = [_a1].Item_ID

UPDATE Items
  SET Physical_Location = 'S.W. Adcock Genealogy Library',
      subLocation = 'Top floor'

DROP TABLE _b1

CREATE TABLE _b1 
  ( Digital_File       Character varying(100),
    Certificate_Type   Character varying(20),
    Certificate_Year   Short,
    Surname_1          Character varying(20),
    GivenNames_1       Character varying(30),
    Surname_2          Character varying(20),
    GivenNames_2       Character varying(30)
  )

INSERT INTO _b1 ( Certificate_Type, Certificate_Year,
    Surname_1, GivenNames_1, Surname_2, GivenNames_2 )
  SELECT Certificate_Type, Certificate_Year,
    Surname_1, GivenNames_1, Surname_2, GivenNames_2 
  FROM _a1

UPDATE _b1
  SET Digital_File = 'file://C:/genCL/BMD/Marriages/' +
       lcase(Surname_1) + '_' + lcase(Surname_2) + '_' + 
       STR([Certificate_Year]) + '.pdf'
  WHERE Certificate_Type = 'Marriage'

UPDATE _b1
  SET Digital_File = 'file://C:/genCL/BMD/Births/' +
       lcase(Surname_1) + '_' +
       cstr([Certificate_Year]) + '.pdf'
  WHERE Certificate_Type = 'Birth'

UPDATE _b1
  SET Digital_File = 'file://C:/genCL/BMD/Deaths/' +
       lcase(Surname_1) + '_' +
       cstr([Certificate_Year]) + '.pdf'
  WHERE Certificate_Type = 'Death'

UPDATE _b1
  SET Digital_File = replace([Digital_File], '’', '')

UPDATE _b1
  SET Digital_File = 'file://C:/genCL/BMD/Births/wood_e_a_1886.pdf'
  WHERE Digital_File = 'file://C:/genCL/BMD/Births/wood_1886.pdf'
    AND Certificate_Type = 'birth'
    AND Certificate_Year = 1886
    AND Surname_1 = 'Wood'
    AND GivenNames_1 = 'Emma Alice'

UPDATE _b1
  SET Digital_File = 'file://C:/genCL/BMD/Deaths/adcock_e_1841.pdf'
  WHERE Digital_File = 'file://C:/genCL/BMD/Deaths/adcock_1841.pdf'
    AND Certificate_Type = 'death'
    AND Certificate_Year = 1841
    AND Surname_1 = 'Adcock'
    AND GivenNames_1 = 'Edmund'

UPDATE _b1
  SET Digital_File = 'file://C:/genCL/BMD/Deaths/adcock_r_1841.pdf'
  WHERE Digital_File = 'file://C:/genCL/BMD/Deaths/adcock_1841.pdf'
    AND Certificate_Type = 'death'
    AND Certificate_Year = 1841
    AND Surname_1 = 'Adcock'
    AND GivenNames_1 = 'Richard'

UPDATE _b1
  SET Digital_File = 'file://C:/genCL/BMD/Deaths/tuxford_g_1848.pdf'
  WHERE Digital_File = 'file://C:/genCL/BMD/Deaths/tuxford_1848.pdf'
    AND Certificate_Type = 'death'
    AND Certificate_Year = 1848
    AND Surname_1 = 'Tuxford'
    AND GivenNames_1 = 'Georgiana'

UPDATE _b1
  SET Digital_File = 'file://C:/genCL/BMD/Deaths/tuxford_s_1848.pdf'
  WHERE Digital_File = 'file://C:/genCL/BMD/Deaths/tuxford_1848.pdf'
    AND Certificate_Type = 'death'
    AND Certificate_Year = 1848
    AND Surname_1 = 'Tuxford'
    AND GivenNames_1 = 'Sarah'

UPDATE _b1
  SET Digital_File = 'file://C:/genCL/BMD/Deaths/adcock_e_1859.pdf'
  WHERE Digital_File = 'file://C:/genCL/BMD/Deaths/adcock_1859.pdf'
    AND Certificate_Type = 'death'
    AND Certificate_Year = 1859
    AND Surname_1 = 'Adcock'
    AND GivenNames_1 = 'Edmund'

UPDATE _b1
  SET Digital_File = 'file://C:/genCL/BMD/Deaths/adcock_s_1859.pdf'
  WHERE Digital_File = 'file://C:/genCL/BMD/Deaths/adcock_1859.pdf'
    AND Certificate_Type = 'death'
    AND Certificate_Year = 1859
    AND Surname_1 = 'Adcock'
    AND GivenNames_1 = 'Sarah'

CREATE UNIQUE INDEX idx01__b1 
  ON _b1 ( Digital_File )

UPDATE _a1
  SET [_a1].Digital_File = [_b1].Digital_File,
      [_a1].URL = [_b1].Digital_File
  FROM _b1 INNER JOIN _a1
    ON [_b1].GivenNames_1 = [_a1].GivenNames_1
    AND [_b1].Surname_1 = [_a1].Surname_1
    AND [_b1].Certificate_Year = [_a1].Certificate_Year
    AND [_b1].Certificate_Type = [_a1].Certificate_Type

DROP TABLE _b1

UPDATE _a1
  SET Identifier = 'swa.genealogy.bmd.' + lcase([Certificate_Type]) +
        '.' + lcase([Surname_1]) + '_' + 
        lcase(SubString([GivenNames_1], 1, 1)) +
        '.' + STR([Certificate_Year]) +
        '.' + Replicate('0', 5-Len(ltrim(rtrim(STR([Item_ID]))))) +
        ltrim(rtrim(STR([Item_ID])))
  WHERE Certificate_Type <> 'Marriage'

UPDATE _a1
  SET Identifier = 'swa.genealogy.bmd.marr.' +
        lcase([Surname_1]) + '_' + lcase([Surname_2]) +
        '.' + STR([Certificate_Year]) +
        '.' + Replicate('0', 5-Len(ltrim(rtrim(STR([Item_ID]))))) +
        ltrim(rtrim(STR([Item_ID])))
  WHERE Certificate_Type = 'Marriage'

UPDATE _a1
  SET Identifier = replace([Identifier], '’', '')

UPDATE _a1
  SET Gender = 'MF'
  WHERE Gender = 'M-F'

UPDATE Items
  SET Items.Digital_File = [_a1].Digital_File,
      Items.URL = [_a1].URL,
      Items.Identifier = [_a1].Identifier
  FROM _a1 INNER JOIN Items
    ON [_a1].Item_ID = Items.Item_ID

INSERT INTO BMD_Certificates ( Item_ID, Gender,
    Surname_1, GivenNames_1, Surname_2, GivenNames_2 )
  SELECT Item_ID, Gender, Surname_1, GivenNames_1,
    Surname_2, GivenNames_2
  FROM _a1

DROP TABLE _a1

UPDATE BMD_Certificates
  SET BMD_Certificates.Item_Type = Items.Item_Type
  FROM Items INNER JOIN BMD_Certificates
    ON Items.Item_ID = BMD_Certificates.Item_ID

UPDATE BMD_Certificates
  SET Marriage_Type = 'Church of England',
      Marriage_Date = '28-JAN-1868',
      Location = 'Roxby-with-Risby, Lincolnshire',
      Reg_Authority = 'General Register Office, England and Wales',
      Reg_District = 'Glanford Brigg',
      Index_Quarter = 'Jan-Feb-Mar',
      Index_Year = 1868,
      Index_Volume = '7a',
      Index_Page = '0955',
      Notes = '-'
   WHERE Surname_1 = 'Holah'
     AND GivenNames_1 = 'Joseph'
     AND Surname_2 = 'Marsh'
     AND GivenNames_2 = 'Emily'

INSERT INTO MODS_Export_BMD ( Item_ID, Item_Type,
    Purchased, Physical_Location, subLocation,
    shelfLocator, Identifier, Digital_File, URL )
  SELECT Item_ID, Item_Type, Purchased, Physical_Location,
    subLocation, shelfLocator, Identifier, Digital_File, URL
  FROM Items

UPDATE MODS_Export_BMD
  SET MODS_Export_BMD.Gender = BMD_Certificates.Gender,
      MODS_Export_BMD.Surname_1 = BMD_Certificates.Surname_1,
      MODS_Export_BMD.GivenNames_1 = BMD_Certificates.GivenNames_1,
      MODS_Export_BMD.Surname_2 = BMD_Certificates.Surname_2,
      MODS_Export_BMD.GivenNames_2 = BMD_Certificates.GivenNames_2,
      MODS_Export_BMD.Marriage_Type = BMD_Certificates.Marriage_Type,
      MODS_Export_BMD.Marriage_Date = BMD_Certificates.Marriage_Date,
      MODS_Export_BMD.Location = BMD_Certificates.Location,
      MODS_Export_BMD.Reg_Authority = BMD_Certificates.Reg_Authority,
      MODS_Export_BMD.Reg_District = BMD_Certificates.Reg_District,
      MODS_Export_BMD.Index_Quarter = BMD_Certificates.Index_Quarter,
      MODS_Export_BMD.Index_Year = BMD_Certificates.Index_Year,
      MODS_Export_BMD.Index_Volume = BMD_Certificates.Index_Volume,
      MODS_Export_BMD.Index_Page = BMD_Certificates.Index_Page,
      MODS_Export_BMD.Notes = BMD_Certificates.Notes 
  FROM MODS_Export_BMD INNER JOIN BMD_Certificates
    ON MODS_Export_BMD.Item_ID = BMD_Certificates.Item_ID

UPDATE MODS_Export_BMD
  SET MODS_Export_BMD.Doc_Type = Item_Types.Doc_Type,
      MODS_Export_BMD.Doc_Type_Short = Item_Types.Doc_Type_Short
  FROM MODS_Export_BMD INNER JOIN Item_Types
    ON MODS_Export_BMD.Item_Type = Item_Types.Item_Type


-- end of script

  
