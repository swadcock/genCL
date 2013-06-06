genCL
=====

Genealogical Bibliography Management

This project is designed to make it easier to integrate Zotero with standard
genealogical software.  The rationale behind it is described in a 2013-06-05
[blog posting] (http://stephensgen.blogspot.ca/).

The project includes the following files

<table>
<caption><b>File List</b></caption>
<thead>
<th>File name</th>
<th>Description</th>
</thead>
<tbody>
<tr>
<td>xsl/Access2MODS.xsl.xml</td>
<td>This xslt program will take a table exported from MS Access and
transform it into a MODS XML file, which passes validation with
the MODS v3.4 schema.</td>
</tr>
<tr>
<td>MODS-genealogy.js</td>
<td>This is a Zotero translator program, derived from the MODS
translator that is part of the standard Zotero installation.</td>
</tr>
<tr>
<td>MODS_BMD.xml</td>
<td>This file is an example of the output produced by
Access2MODS.xsl.xml</td>
</tr>
<tr>
<td>bmd.mdb</td>
<td>This file is a simple MS Access database, which holds
reference information for a variety of BMD certificates.&#160;
Table MODS_Export_BMD can be exported as an XML file, which is
used as input to the Access2MODS.xsl.xml program.</td>
</tr>
<tr>
<td>genCL.csl</td>
<td>This is a "citation stylesheet language" stylesheet.&#160;
It can be used to format BMD certificates that have been 
imported into Zotero.</td>
</tr>
<tr>
<td>bmd_02_xsl_Acc2MODS.bat</td>
<td>This MS Windows script demonstrates how to run the
Access2MODS.xsl.xml program, using the freely available
Saxon software.</td>
</tr>
<tr>
<td>bmd_03_validate_xml.bat</td>
<td>This MS Windows script demonstrates how to validate the
MODS_BMD.xml file against the MODS v3.4 schema, using the
freely available Xerces validator.&#160; MODS_BMD.xml
references a local copy of the MODS schema.</td>
</tr>
</tbody>
</table>

