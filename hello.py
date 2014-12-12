statistic = "Avg time per move" + ": "
sum = 0
count = 0 

if __name__ == "__main__":
    with open('Text.txt', 'rU') as f:
        for line in f:
            if statistic in line:
                number = float(line.rsplit(statistic)[1])
                print number
                sum += float(number)
                count += 1

        print "count is" + str(count)
        print "average statistic is " + str(sum / count) 
 


